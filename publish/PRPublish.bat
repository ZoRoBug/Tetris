@echo off 
echo ɾ��PRPublish�ļ���
IF EXIST PRPublish rmdir /s/q PRPublish
echo ------------------------
echo �ѿͻ��������޸�Ϊ��������
node AlterCfg PRConfig alter
echo ------------------------
SET projectPath="..\client"
SET buildPath="..\publish\PRPublish"
SET cccExePath="D:\Program Files\CocosCreator\CocosCreator.exe"
SET wxBuildParam= "title=��23;platform=wechatgame;buildPath=%buildPath%;startScene=7dCC1hlvNFBIUITq13gbPL;inlineSpriteFrames=true;mergeStartScene=true;md5Cache=true;webOrientation=portrait;debug=false;sourceMaps=false;"
echo ��ʼ����wechatgame...
%cccExePath% --path %projectPath% --build %wxBuildParam%  --force
echo ����wechatgame��ɣ�
echo ------------------------
echo ��ԭ�ͻ�������
node AlterCfg PRConfig reset
echo ------------------------
echo ������ɣ�
pause