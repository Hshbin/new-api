package model

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

const groupRatioRestoreTickInterval = time.Minute

var (
	groupRatioRestoreOnce    sync.Once
	groupRatioRestoreRunning atomic.Bool
)

func StartGroupRatioRestoreTask() {
	groupRatioRestoreOnce.Do(func() {
		if !common.IsMasterNode {
			return
		}
		go func() {
			common.SysLog(fmt.Sprintf("group ratio restore task started: tick=%s", groupRatioRestoreTickInterval))
			ticker := time.NewTicker(groupRatioRestoreTickInterval)
			defer ticker.Stop()

			runGroupRatioRestoreOnce()
			for range ticker.C {
				runGroupRatioRestoreOnce()
			}
		}()
	})
}

func runGroupRatioRestoreOnce() {
	if !groupRatioRestoreRunning.CompareAndSwap(false, true) {
		return
	}
	defer groupRatioRestoreRunning.Store(false)

	restoreSetting := setting.GetGroupRatioRestoreSetting()
	if !restoreSetting.Enabled || len(restoreSetting.Rules) == 0 {
		return
	}

	now := common.GetTimestamp()
	groupRatios := ratio_setting.GetGroupRatioCopy()
	remainingRules := make([]setting.GroupRatioRestoreRule, 0, len(restoreSetting.Rules))
	appliedCount := 0

	for _, rule := range restoreSetting.Rules {
		if rule.RestoreAt > now {
			remainingRules = append(remainingRules, rule)
			continue
		}
		groupRatios[rule.Group] = rule.Ratio
		appliedCount++
	}

	if appliedCount == 0 {
		return
	}

	groupRatioBytes, err := common.Marshal(groupRatios)
	if err != nil {
		common.SysLog("failed to marshal group ratios for restore task: " + err.Error())
		return
	}
	remainingRulesBytes, err := common.Marshal(remainingRules)
	if err != nil {
		common.SysLog("failed to marshal group ratio restore rules: " + err.Error())
		return
	}

	if err := UpdateOptionsBulk(map[string]string{
		"GroupRatio":                         string(groupRatioBytes),
		"group_ratio_restore_setting.rules": string(remainingRulesBytes),
	}); err != nil {
		common.SysLog("failed to apply group ratio restore task: " + err.Error())
		return
	}

	common.SysLog(fmt.Sprintf("group ratio restore task applied %d rule(s)", appliedCount))
}
