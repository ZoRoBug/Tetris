@echo off 
echo 删除PRPublish文件夹
IF EXIST PRPublish rmdir /s/q PRPublish
echo ------------------------
echo 把客户端配置修改为发布配置
node AlterCfg PRConfig alter
echo ------------------------
SET projectPath="..\client"
SET buildPath="..\publish\PRPublish"
SET cccExePath="D:\Program Files\CocosCreator\CocosCreator.exe"
SET wxBuildParam= "title=猜23;platform=wechatgame;buildPath=%buildPath%;startScene=7dCC1hlvNFBIUITq13gbPL;inlineSpriteFrames=true;mergeStartScene=true;md5Cache=true;webOrientation=portrait;debug=false;sourceMaps=false;"
echo 开始生成wechatgame...
%cccExePath% --path %projectPath% --build %wxBuildParam%  --force
echo 生成wechatgame完成！
echo ------------------------
echo 还原客户端配置
node AlterCfg PRConfig reset
echo ------------------------
echo 发布完成！
pause