// --------------------------------------------------------
// 把客户端配置修改为发布配置进行编译
// --------------------------------------------------------
// 编译完成后会还原
// --------------------------------------------------------
"use strict";
const fs = require('fs');

let cfgName = '', cmd = '';
process.argv.forEach(function (value, index) {
    if (Number(index) === 2) cfgName = value;
    if (Number(index) === 3) cmd = value;
});
if (cfgName === '') {
    console.error('未传入发布名称参数');
    return;
} 
const config = require('./' + cfgName + '/client/Config');

let cfgPath = '../client/assets/script/Config.js';
let cfgTmpPath = '../client/assets/script/Config.tmp';
if (cmd === 'reset') {
    fs.copyFileSync(cfgTmpPath, cfgPath);
    fs.unlinkSync(cfgTmpPath + '.meta');
    fs.unlinkSync(cfgTmpPath);
    return;
}
fs.copyFileSync(cfgPath, cfgTmpPath);
    
let strSerch = 'address: \'';
let cfgData = String(fs.readFileSync(cfgPath));
let startPos = cfgData.indexOf(strSerch);
if (startPos === -1) return;

let headData = cfgData.slice(0, startPos + strSerch.length);
let tailData = cfgData.slice(startPos + strSerch.length);
let endPos = tailData.indexOf('\'');
tailData = tailData.slice(endPos);

cfgData = headData + config.gateserver.address + tailData;
fs.writeFile(cfgPath, cfgData, function (error) {
    if (error) console.error(cfgPath + '写入失败');
});





