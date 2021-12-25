const config = require('./Config');
const utility = require('./public/Utility');
const wxcloud = require('./public/WXCloud');
const gameScore = require('./public/GameScore');

function UpdateRank() {
    let nodeRank = this.node.getChildByName('Rank');
    nodeRank.getComponent(cc.Label).string = '--';
    utility.GetWeiXinUserInfo(function (info, btnAuth) {
        if (btnAuth) {
            this.btnAuth = btnAuth;
            if (!this.isShow) btnAuth.destroy();
        }
        if (!info) return;
        let name = info.nickName, head = info.avatarUrl;
        let area = info.province + info.country;
        wxcloud.SaveScore(name, head, area);
        wxcloud.GetTDayRank(function (rank) {
            nodeRank.getComponent(cc.Label).string = String(rank);
        });
    }.bind(this), { node: nodeRank, text: '点击查看排名' });
}

function UpdateScore(score) {
    let nodeScore = this.node.getChildByName('Score');
    nodeScore.getComponent(cc.Label).string = String(score);
}

function UpdateMaxScore() {
    let score = gameScore.GetMaxScore();
    let str = '历史最高分：' + String(score);
    let nodeHistory = this.node.getChildByName('History');
    nodeHistory.getComponent(cc.Label).string = str;
}

cc.Class({
    extends: cc.Component,

    start() {
        let nodeRankLink = this.node.getChildByName('RankLink');
        nodeRankLink.on(cc.Node.EventType.TOUCH_END, function () {
            let nodeRank = cc.find('Canvas').getChildByName('Rank');
            nodeRank.getComponent('Rank').Show();
        }, this);

        let nodeShareLink = this.node.getChildByName('ShareLink');
        nodeShareLink.on(cc.Node.EventType.TOUCH_END, function () {
            if (!utility.IsWeinXinPlatform()) return;
            let length = config.shareImgs.length;
            let idx = utility.Random(0, length - 1);
            wx.shareAppMessage({
                title: config.shareImgs[idx].title,
                imageUrlId: config.shareImgs[idx].id,
                imageUrl: config.shareImgs[idx].url
            });
        }, this);

        let nodeAgainBtn = this.node.getChildByName('Again');
        nodeAgainBtn.on(cc.Node.EventType.TOUCH_END, function () {
            this.isShow = false;
            if (this.btnAuth) this.btnAuth.destroy();
            let actionMove = cc.moveTo(0.3, cc.v2(0, this.node.height));
            this.node.runAction(cc.sequence(actionMove, cc.callFunc(function () {
                let nodeBlockGame = cc.find('Canvas').getChildByName('BlockGame');
                nodeBlockGame.getComponent('BlockGame').RestartGame();
            })));
        }, this);
    },

    Show(score) {
        this.isShow = true;
        let isUpdate = gameScore.SetMaxScore(score);
        isUpdate = gameScore.SetTodayScore(score) || isUpdate;
        if (isUpdate) {
            let nodeRank = cc.find('Canvas').getChildByName('Rank');
            nodeRank.getComponent('Rank').Reset();
        }
        let actionMove = cc.moveTo(0.3, cc.v2(0, 0));
        this.node.runAction(cc.sequence(actionMove, cc.callFunc(function () {
            UpdateScore.call(this, score);
            UpdateMaxScore.call(this);
            UpdateRank.call(this);
        }.bind(this))));
    },
});
