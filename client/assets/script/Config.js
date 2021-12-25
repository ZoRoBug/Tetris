// --------------------------------------------------------
// 客户端所有配置
// --------------------------------------------------------
//
// --------------------------------------------------------
"use strict";

const config = {
    itemName: {
        score: 'MaxScore',
        rule: 'ShowRule',
    },

    ruleTips: '游戏规则\r\n\r\n\
（1）方块数字相加和为 10 则合并\r\n\
（2）方块数字相加和为 20 则合并\r\n\
（3）方块数字相加和为 23 则消除\r\n\r\n\
玩家需控制方块下落位置，当方块累积到最顶端或倒计时为零则游戏结束\r\n\r\n\
游戏简单，直觉第一，计算第二',

    dropSpeed: 800, // 方块下落初始值
    speedUpList: [
        [30, 50], [30, 50], [30, 50], [30, 50], [30, 50], [30, 50],
        [30, 50], [60, 50], [90, 50], [120, 50], [150, 50], [180, 50]
    ], // 方块下落加速列表[秒，毫秒]

    shareTitle: {
        tdayRank: [
            '今日高分榜，你排在第几？'
        ],
        worldRank: [
            '世界排行榜，你排在第几？'
        ],
        areaRank: [
            '地域排行榜，你排在第几？'
        ]
    },

    shareImgs: [
        {
            title: '方块数字和为10或20则合并, 为23则消除。',
            url: 'https://mmocgame.qpic.cn/wechatgame/U0KocDR9Xa3icx8siaAeV19RE6WTQFm2ze76Zl22ZY8lTmPRBPIBd75a0phJic9s1cz/0',
            id: 'srfw2hZdTUatQBolFK7hfw=='
        },
        {
            title: '@所有人，试试吧，看你能得到多少分！',
            url: 'https://mmocgame.qpic.cn/wechatgame/U0KocDR9Xa2juTSZmoNpeiaXzfgt5y5dibS0aZ0BjhOQnILbIpYvtIfQ7yGaF6xQ5X/0',
            id: 'sHjpV8MVRPyClWQQr0hZfQ=='
        },
        {
            title: '游戏很容易，但很难获得高分，快来试试吧！',
            url: 'https://mmocgame.qpic.cn/wechatgame/U0KocDR9Xa2ib53FQvLh3bDbKLtdwfywaYgwhz0x7v9C13ZL5mMkibqCbuhJQwSWgj/0',
            id: 'PUFpLE8VT/+BxaIwac4VdA=='
        },
    ],
};

module.exports = config;