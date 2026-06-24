package setting

import (
	"errors"
	"sort"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/config"
)

type GroupRatioRestoreRule struct {
	Group     string  `json:"group"`
	Ratio     float64 `json:"ratio"`
	RestoreAt int64   `json:"restore_at"`
}

type GroupRatioRestoreSetting struct {
	Enabled bool                    `json:"enabled"`
	Rules   []GroupRatioRestoreRule `json:"rules"`
}

var groupRatioRestoreSetting = GroupRatioRestoreSetting{
	Enabled: true,
	Rules:   []GroupRatioRestoreRule{},
}

func init() {
	config.GlobalConfig.Register("group_ratio_restore_setting", &groupRatioRestoreSetting)
}

func GetGroupRatioRestoreSetting() GroupRatioRestoreSetting {
	rules := make([]GroupRatioRestoreRule, 0, len(groupRatioRestoreSetting.Rules))
	for _, rule := range groupRatioRestoreSetting.Rules {
		rule.Group = strings.TrimSpace(rule.Group)
		if rule.Group == "" || rule.Ratio < 0 || rule.RestoreAt <= 0 {
			continue
		}
		rules = append(rules, rule)
	}
	sort.SliceStable(rules, func(i, j int) bool {
		return rules[i].RestoreAt < rules[j].RestoreAt
	})
	return GroupRatioRestoreSetting{
		Enabled: groupRatioRestoreSetting.Enabled,
		Rules:   rules,
	}
}

func CheckGroupRatioRestoreRules(jsonStr string) error {
	var rules []GroupRatioRestoreRule
	if err := common.Unmarshal([]byte(jsonStr), &rules); err != nil {
		return err
	}
	for _, rule := range rules {
		if strings.TrimSpace(rule.Group) == "" {
			return errors.New("group ratio restore group is required")
		}
		if rule.Ratio < 0 {
			return errors.New("group ratio restore ratio must be not less than 0")
		}
		if rule.RestoreAt <= 0 {
			return errors.New("group ratio restore_at must be a unix timestamp")
		}
	}
	return nil
}
