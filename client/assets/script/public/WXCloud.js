// --------------------------------------------------------
// 微信云开发
// --------------------------------------------------------
// 
// --------------------------------------------------------
"use strict";
const utility = require('./Utility');
const gameScore = require('./GameScore');

const SCORE_NAME = 'score';
const ENV_NAME = 'guess23-publish-zz';

function GetDB() {
    return wx.cloud.database({ env: ENV_NAME });
}

function GetOpenID() {
    wx.cloud.callFunction({
        name: 'GetOpenID',
        success: function (res) {
            this.openid = res.result.openid;
            this.GetRecord(function (info) {
                gameScore.SetMaxScore(info.score, true);
                let today = utility.FormatDate('YYYY-mm-dd');
                if (today === info.tday) {
                    gameScore.SetTodayScore(info.tscore, true);
                }
            });
        }.bind(this),
        fail: console.error
    })
}

function AddScore(name, head, area) {
    GetDB().collection(SCORE_NAME).add({
        data: {
            name: name, head: head, area: area,
            score: gameScore.GetMaxScore(),
            tday: utility.FormatDate('YYYY-mm-dd'),
            tscore: gameScore.GetTodayScore()
        },
        fail: console.error
    })
}

function UpdateScore(openid, name, head, area) {
    GetDB().collection(SCORE_NAME).where({
        _openid: openid,
    }).update({
        data: {
            name: name, head: head, area: area,
            score: gameScore.GetMaxScore(),
            tday: utility.FormatDate('YYYY-mm-dd'),
            tscore: gameScore.GetTodayScore()
        },
        fail: console.error
    })
}

const wxcloud = {
    Init: function () {
        if (!utility.IsWeinXinPlatform()) return;
        wx.cloud.init({ env: ENV_NAME });
        GetOpenID.call(this);
    },

    GetRecord: function (callback) {
        if (!this.openid) return;
        GetDB().collection(SCORE_NAME).where({
            _openid: this.openid,
        }).get({
            success: function (res) {
                if (res.data.length === 0) return;
                callback(res.data[0]);
            },
            fail: console.error
        })
    },

    SaveScore: function (name, head, area) {
        if (!this.openid) return;
        GetDB().collection(SCORE_NAME).where({
            _openid: this.openid,
        }).get({
            success: function (res) {
                if (res.data.length === 0) {
                    AddScore(name, head, area);
                } else {
                    UpdateScore(this.openid, name, head, area);
                }
            }.bind(this)
        })
    },

    GetTDayRank: function (callback) {
        if (!this.openid) return;
        let tScore = gameScore.GetTodayScore();
        if (!tScore) {
            callback(0);
            return;
        }
        GetDB().collection(SCORE_NAME).where({
            tday: utility.FormatDate('YYYY-mm-dd'),
            tscore: GetDB().command.gt(tScore),
        }).count({
            success: function (res) {
                callback(res.total + 1);
            },
            fail: console.error
        })
    },

    GetWorldRank: function (callback) {
        if (!this.openid) return;
        let score = gameScore.GetMaxScore();
        if (!score) {
            callback(0);
            return;
        }
        GetDB().collection(SCORE_NAME).where({
            score: GetDB().command.gt(score),
        }).count({
            success: function (res) {
                callback(res.total + 1);
            },
            fail: console.error
        })
    },

    GetAreaRank: function (area, callback) {
        if (!this.openid) return;
        let score = gameScore.GetMaxScore();
        if (!score) {
            callback(0);
            return;
        }
        GetDB().collection(SCORE_NAME).where({
            area: area,
            score: GetDB().command.gt(score),
        }).count({
            success: function (res) {
                callback(res.total + 1);
            },
            fail: console.error
        })
    },

    GetTDayList: function (start, count, callback) {
        if (!this.openid) return;
        GetDB().collection(SCORE_NAME).where({
            tday: utility.FormatDate('YYYY-mm-dd'),
            tscore: GetDB().command.gt(0),
        }).orderBy('tscore', 'desc')
            .skip(start)
            .limit(count)
            .get({
                success: function (res) {
                    callback(res.data);
                },
                fail: console.error
            })
    },

    GetWorldList: function (start, count, callback) {
        if (!this.openid) return;
        GetDB().collection(SCORE_NAME).where({
            score: GetDB().command.gt(0),
        }).orderBy('score', 'desc')
            .skip(start)
            .limit(count)
            .get({
                success: function (res) {
                    callback(res.data);
                },
                fail: console.error
            })
    },

    GetAreaList: function (start, count, area, callback) {
        if (!this.openid) return;
        GetDB().collection(SCORE_NAME).where({
            area: area,
            score: GetDB().command.gt(0),
        }).orderBy('score', 'desc')
            .skip(start)
            .limit(count)
            .get({
                success: function (res) {
                    callback(res.data);
                },
                fail: console.error
            })
    },
};

module.exports = wxcloud;