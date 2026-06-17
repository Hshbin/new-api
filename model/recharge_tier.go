package model

import (
	"fmt"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"

	"github.com/shopspring/decimal"
)

const (
	RechargeCreditSourceAdminAdd      = "admin_add"
	RechargeCreditSourceAdminOverride = "admin_override"
)

type RechargeCredit struct {
	Id        int    `json:"id"`
	UserId    int    `json:"user_id" gorm:"index"`
	Quota     int    `json:"quota"`
	Source    string `json:"source" gorm:"type:varchar(32);index"`
	SourceId  string `json:"source_id" gorm:"type:varchar(128);index"`
	CreatedAt int64  `json:"created_at" gorm:"bigint;index"`
}

func SyncRechargeTierGroupRatios() {
	tierSetting := setting.GetRechargeTierSetting()
	for _, rule := range tierSetting.Rules {
		ratio_setting.SetGroupRatio(rule.Group, rule.Ratio)
	}
	common.OptionMap["GroupRatio"] = ratio_setting.GroupRatio2JSONString()
}

func RecordAdminRechargeCredit(userId int, quota int, source string) {
	if userId <= 0 || quota <= 0 {
		return
	}
	credit := RechargeCredit{
		UserId:    userId,
		Quota:     quota,
		Source:    source,
		SourceId:  fmt.Sprintf("%s:%d:%d:%d", source, userId, quota, time.Now().UnixNano()),
		CreatedAt: common.GetTimestamp(),
	}
	if err := DB.Create(&credit).Error; err != nil {
		common.SysLog("failed to record recharge credit: " + err.Error())
		return
	}
	AutoUpdateUserRechargeTier(userId)
}

func AutoUpdateUserRechargeTier(userId int) {
	if userId <= 0 {
		return
	}
	tierSetting := setting.GetRechargeTierSetting()
	if !tierSetting.Enabled || len(tierSetting.Rules) == 0 {
		return
	}

	totalQuota, err := GetUserCumulativeRechargeQuota(userId)
	if err != nil {
		common.SysLog(fmt.Sprintf("failed to calculate recharge tier quota for user %d: %s", userId, err.Error()))
		return
	}
	if common.QuotaPerUnit <= 0 {
		return
	}
	totalAmount := decimal.NewFromInt(int64(totalQuota)).Div(decimal.NewFromFloat(common.QuotaPerUnit))

	targetGroup := tierSetting.BaseGroup
	for _, rule := range tierSetting.Rules {
		if totalAmount.GreaterThan(decimal.NewFromFloat(rule.Threshold)) {
			targetGroup = rule.Group
		}
	}
	if targetGroup == "" {
		return
	}

	var user User
	if err := DB.Select("id", "group").Where("id = ?", userId).First(&user).Error; err != nil {
		return
	}
	if user.Group == targetGroup {
		return
	}

	managedGroups := map[string]struct{}{tierSetting.BaseGroup: {}}
	for _, rule := range tierSetting.Rules {
		managedGroups[rule.Group] = struct{}{}
	}
	if _, ok := managedGroups[user.Group]; !ok {
		return
	}

	if err := DB.Model(&User{}).Where("id = ?", userId).Update("group", targetGroup).Error; err != nil {
		common.SysLog(fmt.Sprintf("failed to update recharge tier group for user %d: %s", userId, err.Error()))
		return
	}
	_ = UpdateUserGroupCache(userId, targetGroup)
	RecordLog(userId, LogTypeSystem, fmt.Sprintf("Auto updated user group by cumulative recharge: %s", targetGroup))
}

func GetUserCumulativeRechargeQuota(userId int) (int, error) {
	if userId <= 0 {
		return 0, nil
	}
	total := decimal.Zero

	var redeemedQuota int64
	if err := DB.Model(&Redemption{}).
		Where("used_user_id = ? AND status = ?", userId, common.RedemptionCodeStatusUsed).
		Select("COALESCE(SUM(quota), 0)").
		Scan(&redeemedQuota).Error; err != nil {
		return 0, err
	}
	total = total.Add(decimal.NewFromInt(redeemedQuota))

	var adminQuota int64
	if err := DB.Model(&RechargeCredit{}).
		Where("user_id = ?", userId).
		Select("COALESCE(SUM(quota), 0)").
		Scan(&adminQuota).Error; err != nil {
		return 0, err
	}
	total = total.Add(decimal.NewFromInt(adminQuota))

	return int(total.IntPart()), nil
}
