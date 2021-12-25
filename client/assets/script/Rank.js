const config = require('./Config');
const utility = require('./public/Utility');
const wxcloud = require('./public/WXCloud');

const REQUEST_ITEM_COUNT = 20;

function GetRankList(rankType) {
    if (rankType === 0) {
        return cc.find('Bg/RankList/TDayList/view/content', this.node);
    } else if (rankType === 1) {
        return cc.find('Bg/RankList/WorldList/view/content', this.node);
    } else if (rankType === 2) {
        return cc.find('Bg/RankList/AreaList/view/content', this.node);
    }
}

function GetRankTitle(rankType) {
    if (rankType === 0) {
        return '今日高分榜，您排名第%s';
    } else if (rankType === 1) {
        return '世界排行榜，您排名第%s';
    } else if (rankType === 2) {
        let area = '无名地区';
        if (this.area && this.area.length > 0) {
            area = this.area;
        }
        return area + '，您排名第%s';
    }
}

function GetShareTitle(rankType) {
    if (rankType === 0) {
        return config.shareTitle.tdayRank;
    } else if (rankType === 1) {
        return config.shareTitle.worldRank;
    } else if (rankType === 2) {
        return config.shareTitle.areaRank;
    }
}

function OpenWaitAction(isOpen) {
    cc.find('Bg/Wait', this.node).active = isOpen;
}

function UpdateItem(rankType, nodeItem, rankItem, rankNum) {
    let sprite = nodeItem.getComponent(cc.Sprite);
    if (rankNum % 2 === 0) {
        sprite.spriteFrame = this.itemBg1SpriteFrame;
    } else {
        sprite.spriteFrame = this.itemBg2SpriteFrame;
    }

    let nodeName = nodeItem.getChildByName('Name');
    nodeName.getComponent(cc.Label).string = rankItem.name;

    let nodeScore = nodeItem.getChildByName('Score');
    let score = (rankType === 0) ? rankItem.tscore : rankItem.score;
    nodeScore.getComponent(cc.Label).string = score;

    let urlHead = g_head.To46(rankItem.head);
    g_head.Load(urlHead, function (spriteFrame) {
        if (!spriteFrame) return;
        let nodeHead = nodeItem.getChildByName('Head');
        let headSprite = nodeHead.getComponent(cc.Sprite);
        headSprite.spriteFrame = spriteFrame;
    }.bind(this));

    let nodeNum = nodeItem.getChildByName('Num');
    let nodeNum1 = nodeItem.getChildByName('Num1');
    let nodeNum2 = nodeItem.getChildByName('Num2');
    let nodeNum3 = nodeItem.getChildByName('Num3');
    nodeNum1.getComponent(cc.Label).string = String(rankNum);
    nodeNum2.getComponent(cc.Label).string = String(rankNum);
    nodeNum3.getComponent(cc.Label).string = String(rankNum);
    nodeNum.getComponent(cc.Label).string = String(rankNum);
    nodeNum1.active = (rankNum === 1);
    nodeNum2.active = (rankNum === 2);
    nodeNum3.active = (rankNum === 3);
    nodeNum.active = (rankNum > 3);
}

function UpdateList(rankType, rankList) {
    let nodeRankList = GetRankList.call(this, rankType);
    let listNodeLength = nodeRankList.childrenCount;
    for (let i = 0; i < rankList.length; ++i) {
        let nodeItem = cc.instantiate(this.rankItemPrefab);
        nodeRankList.addChild(nodeItem);
        let rank = i + listNodeLength + 1;
        UpdateItem.call(this, rankType, nodeItem, rankList[i], rank);
    }
}

function UpdateSelfRank() {
    let selfRank = this.selfRankList[this.rankType];
    let title = GetRankTitle.call(this, this.rankType);
    let strRank = title.replace('%s', selfRank);
    if (!this.wxAuthPass) {
        strRank = '数据未同步，无法获取排名';
    } else if (selfRank === 0) {
        strRank = '您今天还未游戏，没有数据';
    }
    let nodeSelfRank = cc.find('Bg/SelfRank', this.node);
    nodeSelfRank.getComponent(cc.Label).string = strRank;
}

function UpdateRankTab() {
    let nodeTDayTab = cc.find('Bg/TDayTab', this.node);
    let nodeWorldTab = cc.find('Bg/WorldTab', this.node);
    let nodeAreaTab = cc.find('Bg/AreaTab', this.node);

    let btnTDayTab = nodeTDayTab.getComponent(cc.Button);
    let btnWorldTab = nodeWorldTab.getComponent(cc.Button);
    let btnAreaTab = nodeAreaTab.getComponent(cc.Button);

    btnTDayTab.interactable = (this.rankType === 0);
    btnWorldTab.interactable = (this.rankType === 1);
    btnAreaTab.interactable = (this.rankType === 2);
}

function UpdateRankList(callback) {
    let nodeRankList = cc.find('Bg/RankList', this.node);
    let nodeTDayList = cc.find('TDayList', nodeRankList);
    let nodeWorldList = cc.find('WorldList', nodeRankList);
    let nodeAreaList = cc.find('AreaList', nodeRankList);
    nodeTDayList.active = true;
    nodeWorldList.active = true;
    nodeAreaList.active = true;

    let widthMove = nodeRankList.width;
    let xTDay = 0, xWorld = 0, xArea = 0;
    if (this.rankType === 0) {
        xTDay = 0, xWorld = widthMove, xArea = widthMove * 2;
    } else if (this.rankType === 1) {
        xTDay = -widthMove, xWorld = 0, xArea = widthMove;
    } else if (this.rankType === 2) {
        xTDay = -widthMove * 2, xWorld = -widthMove, xArea = 0;
    }

    let actTDayShow = cc.moveTo(0.2, cc.v2(0, 0));
    let actTDayHide = cc.moveTo(0.2, cc.v2(xTDay, 0));

    let actWorldShow = cc.moveTo(0.2, cc.v2(0, 0));
    let actWorldHide = cc.moveTo(0.2, cc.v2(xWorld, 0));

    let actAreaShow = cc.moveTo(0.2, cc.v2(0, 0));
    let actAreaHide = cc.moveTo(0.2, cc.v2(xArea, 0));

    let actionFunc = cc.callFunc(callback);
    if (this.rankType === 0) {
        nodeTDayList.runAction(actTDayShow);
        nodeWorldList.runAction(actWorldHide);
        nodeAreaList.runAction(cc.sequence(actAreaHide, actionFunc));
    } else if (this.rankType === 1) {
        nodeTDayList.runAction(actTDayHide);
        nodeWorldList.runAction(actWorldShow);
        nodeAreaList.runAction(cc.sequence(actAreaHide, actionFunc));
    } else if (this.rankType === 2) {
        nodeTDayList.runAction(actTDayHide);
        nodeWorldList.runAction(actWorldHide);
        nodeAreaList.runAction(cc.sequence(actAreaShow, actionFunc));
    }
}

function RequestRank() {
    if (!this.wxAuthPass) return;
    if (this.requestDone[this.rankType]) return;

    let rankType = this.rankType;
    OpenWaitAction.call(this, true);
    function CallBack(rankList) {
        OpenWaitAction.call(this, false);
        UpdateList.call(this, rankType, rankList);
        if (rankList.length < REQUEST_ITEM_COUNT) {
            this.requestDone[rankType] = true;
        }
    }

    let nodeRankList = GetRankList.call(this, this.rankType);
    let start = nodeRankList.childrenCount;
    let count = REQUEST_ITEM_COUNT;
    if (this.rankType === 0) {
        wxcloud.GetTDayList(start, count, CallBack.bind(this));
    } else if (this.rankType === 1) {
        wxcloud.GetWorldList(start, count, CallBack.bind(this));
    } else if (this.rankType === 2) {
        wxcloud.GetAreaList(start, count, this.area, CallBack.bind(this));
    }
}

function SwitchTab(rankType) {
    this.rankType = rankType;
    UpdateRankTab.call(this);
    UpdateSelfRank.call(this);
    UpdateRankList.call(this, function () {
        let nodeRankList = GetRankList.call(this, this.rankType);
        if (nodeRankList.childrenCount < REQUEST_ITEM_COUNT) {
            RequestRank.call(this);
        }
    }.bind(this));
}

function GetSelfRank() {
    wxcloud.GetTDayRank(function (rank) {
        this.selfRankList[0] = rank;
        UpdateSelfRank.call(this);
    }.bind(this));

    wxcloud.GetWorldRank(function (rank) {
        this.selfRankList[1] = rank;
        UpdateSelfRank.call(this);
    }.bind(this));

    wxcloud.GetAreaRank(this.area, function (rank) {
        this.selfRankList[2] = rank;
        UpdateSelfRank.call(this);
    }.bind(this));
}

function ShowFace(isShow) {
    this.isShow = isShow;
    this.node.active = true;
    let width = this.node.width;
    let nodeBg = this.node.getChildByName('Bg');
    let actBgShow = cc.moveTo(0.1, cc.v2(0, nodeBg.y));
    let actBgHide = cc.moveTo(0.1, cc.v2(-width, nodeBg.y));
    nodeBg.runAction(cc.sequence(isShow ? actBgShow : actBgHide,
        cc.callFunc(function () {
            if (!isShow) {
                this.node.runAction(cc.moveTo(0, cc.v2(-width, 0)));
            } else {
                this.btnAuth = null;
                this.wxAuthPass = false;
                utility.GetWeiXinUserInfo(function (info, btnAuth) {
                    if (btnAuth) {
                        this.btnAuth = btnAuth;
                        if (!this.isShow) btnAuth.destroy();
                    }
                    if (!info) return;
                    this.wxAuthPass = true;
                    this.area = info.province + info.country;
                    let name = info.nickName, head = info.avatarUrl;
                    if (!this.btnAuth) wxcloud.SaveScore(name, head, this.area);
                    GetSelfRank.call(this);
                    RequestRank.call(this);
                }.bind(this), { node: nodeBg, text: '同步数据' });
            }
        }.bind(this))));
    if (isShow) {
        this.node.runAction(cc.moveTo(0, cc.v2(0, 0)));
    } else {
        if (this.btnAuth) this.btnAuth.destroy();
    }
}

cc.Class({
    extends: cc.Component,

    properties: {
        rankItemPrefab: {
            default: null,
            type: cc.Prefab,
        },
        itemBg1SpriteFrame: {
            default: null,
            type: cc.SpriteFrame,
        },
        itemBg2SpriteFrame: {
            default: null,
            type: cc.SpriteFrame,
        },
    },

    Show() {
        ShowFace.call(this, true);
    },

    Reset() {
        this.area = null;
        this.rankType = 0;
        this.requestDone = [];
        this.wxAuthPass = false;
        this.selfRankList = [0, 0, 0];
        OpenWaitAction.call(this, false);
        SwitchTab.call(this, 0);

        GetRankList.call(this, 0).removeAllChildren();
        GetRankList.call(this, 1).removeAllChildren();
        GetRankList.call(this, 2).removeAllChildren();
    },

    start() {
        let waitNode = cc.find('Bg/Wait', this.node);
        waitNode.runAction(cc.repeatForever(cc.rotateBy(1.5, 180)));

        cc.find('Bg/RankList/TDayList', this.node).on('scroll-to-bottom', function () {
            RequestRank.call(this);
        }, this);
        cc.find('Bg/RankList/WorldList', this.node).on('scroll-to-bottom', function () {
            RequestRank.call(this);
        }, this);
        cc.find('Bg/RankList/AreaList', this.node).on('scroll-to-bottom', function () {
            RequestRank.call(this);
        }, this);

        let nodeTDayTab = cc.find('Bg/TDayTab', this.node);
        nodeTDayTab.on(cc.Node.EventType.TOUCH_END, function () {
            SwitchTab.call(this, 0);
        }, this);
        let nodeWorldTab = cc.find('Bg/WorldTab', this.node);
        nodeWorldTab.on(cc.Node.EventType.TOUCH_END, function () {
            SwitchTab.call(this, 1);
        }, this);
        let nodeAreaTab = cc.find('Bg/AreaTab', this.node);
        nodeAreaTab.on(cc.Node.EventType.TOUCH_END, function () {
            SwitchTab.call(this, 2);
        }, this);

        let nodeShareLink = cc.find('Bg/ShareLink', this.node);
        nodeShareLink.on(cc.Node.EventType.TOUCH_END, function () {
            if (!utility.IsWeinXinPlatform()) return;
            let nodeBgAt = this.node.getChildByName('BgAt');
            let rectBgAt = utility.NodeToWXPos(nodeBgAt);
            let titleList = GetShareTitle(this.rankType);
            canvas.toTempFilePath({
                x: rectBgAt.x, y: rectBgAt.y,
                width: rectBgAt.width, height: rectBgAt.width / 1.25,
                destWidth: rectBgAt.width, destHeight: rectBgAt.width / 1.25,
                success: function (res) {
                    let idx = utility.Random(0, titleList.length - 1);
                    wx.shareAppMessage({
                        title: titleList[idx],
                        imageUrl: res.tempFilePath
                    });
                },
                fail: function () {
                    let tips = '截图失败，请稍后重试';
                    g_msgbox.Show(null, tips, g_msgbox.MB_OK);
                }
            });
        }, this);

        let nodeClose = cc.find('Bg/Close', this.node);
        nodeClose.on(cc.Node.EventType.TOUCH_END, function () {
            ShowFace.call(this, false);
        }, this);

        this.Reset();
    },
});
