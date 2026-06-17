package setting

import (
	"errors"
	"sort"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/config"
)

type RechargeTierRule struct {
	Threshold float64 `json:"threshold"`
	Group     string  `json:"group"`
	Ratio     float64 `json:"ratio"`
}

type RechargeTierSetting struct {
	Enabled   bool               `json:"enabled"`
	BaseGroup string             `json:"base_group"`
	Rules     []RechargeTierRule `json:"rules"`
}

var rechargeTierSetting = RechargeTierSetting{
	Enabled:   true,
	BaseGroup: "default",
	Rules: []RechargeTierRule{
		{Threshold: 100, Group: "vip1", Ratio: 0.225},
		{Threshold: 500, Group: "vip2", Ratio: 0.2},
	},
}

func init() {
	config.GlobalConfig.Register("recharge_tier_setting", &rechargeTierSetting)
}

func GetRechargeTierSetting() RechargeTierSetting {
	rules := make([]RechargeTierRule, 0, len(rechargeTierSetting.Rules))
	for _, rule := range rechargeTierSetting.Rules {
		rule.Group = strings.TrimSpace(rule.Group)
		if rule.Group == "" || rule.Threshold < 0 || rule.Ratio < 0 {
			continue
		}
		rules = append(rules, rule)
	}
	sort.SliceStable(rules, func(i, j int) bool {
		return rules[i].Threshold < rules[j].Threshold
	})

	baseGroup := strings.TrimSpace(rechargeTierSetting.BaseGroup)
	if baseGroup == "" {
		baseGroup = "default"
	}

	return RechargeTierSetting{
		Enabled:   rechargeTierSetting.Enabled,
		BaseGroup: baseGroup,
		Rules:     rules,
	}
}

func RechargeTierRulesToJSONString() string {
	bytes, err := common.Marshal(rechargeTierSetting.Rules)
	if err != nil {
		return "[]"
	}
	return string(bytes)
}

func CheckRechargeTierRules(jsonStr string) error {
	var rules []RechargeTierRule
	if err := common.Unmarshal([]byte(jsonStr), &rules); err != nil {
		return err
	}
	for _, rule := range rules {
		if rule.Threshold < 0 {
			return errors.New("recharge tier threshold must be not less than 0")
		}
		if strings.TrimSpace(rule.Group) == "" {
			return errors.New("recharge tier group is required")
		}
		if rule.Ratio < 0 {
			return errors.New("recharge tier ratio must be not less than 0")
		}
	}
	return nil
}
