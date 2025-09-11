// 客語學習資料
const myCatalog = `
愛客書	01 天氣,02 問好,一、問好 00百句,二、紹介 00百句,03 相遇,04 道別,05 行禮,06 感謝,07 等候,08 問姓名,09 問年紀,10 問生肖,11 問年級,12 問身份,13 問星期,14 問日期,15 問幾點,16 趕時間,17 遲到,18 問處所,19 問去向,20 距離,21 問路,22 座位,23 問意願,24 問擁有,25 問方式,26 問原因,27 事實確認,28 認知確認,29 能力確認,30 溝通確認,31 就寢,32 洗衣服,33 用餐,34 味道,35 感冒,36 視力檢查,37 去廁所,38 剪頭髮,39 看電影,40 音樂,41 打球,42 猜拳,43 散步,44 拍照,45 付錢,46 換錢,47 買車票,48 買門票,49 加汽油,50 遺失,51 找東西,52 語言能力,53 語言翻譯,54 數學加減,55 數學數量,56 大小,57 點名,58 排隊,59 手動作,60 腳動作,61 畢業
百句	1-01問好,1-02禮貌,2-03姓名,2-04年紀,2-05年級,2-06身份,2-07擁有,3-08星期,3-09時間,3-10交通,3-11住處,3-12去向,4-13排隊,4-14動作,5-15學習,5-16活動,6-17比較,6-18算數,6-19顏色,7-20認知,8-21關心,8-22健康,8-23感覺,8-24鼓勵
`;

const myData = `
分類	客語	拼音	華語	音檔
01 天氣	你會熱無？	henˋ bbue ngiedˋ moˋ?	你會熱嗎？	oikasu-k1-001.mp3
01 天氣	𠊎毋會熱。	ngaiˋ mˇ-bboi ngiedˋ.	我不會熱。	oikasu-k1-002.mp3
01 天氣	𠊎真熱。	ngaiˋ zhinˇ ngiedˋ.	我很熱。	oikasu-k1-003.mp3
01 天氣	今日真熱。	ginˇ-ngidˊ zhinˇ ngiedˋ.	今天很熱。	oikasu-k1-004.mp3
01 天氣	你會寒無？	henˋ bbue honˋ moˋ?	你會冷嗎？	oikasu-k1-005.mp3
01 天氣	𠊎毋會寒。	ngaiˋ mˇ-bboi honˋ.	我不會冷。	oikasu-k1-006.mp3
01 天氣	𠊎會寒。	ngaiˋ bbue honˋ.	我會冷。	oikasu-k1-007.mp3
01 天氣	今日真寒。	ginˇ-ngidˊ zhinˇ honˋ.	今天很冷。	oikasu-k1-008.mp3
02 問好	你好！	henˋ hooˆ!	你好！	oikasu-k1-009.mp3
02 問好	𠢕早！	ngauˋ zooˆ!	早安！	oikasu-k1-010.mp3
02 問好	食飽吂？	shiedˋ-bauˆ mangˇ?	吃飽沒？	oikasu-k1-011.mp3
02 問好	食飽啊。	shiedˋ-bauˆ aˆ.	吃飽了。	oikasu-k1-012.mp3
02 問好	你這站好無？	henˋ liˊ--cam hooˆ moˋ?	你最近好嗎？	oikasu-k1-013.mp3
02 問好	猶毋會䆀。	iaˋ mˇ-bboi bbaiˇ.	還不錯。	oikasu-k1-014.mp3
02 問好	你過了好無？	henˋ gooˆ leeuˆ hooˆ moˋ?	你過得好嗎？	oikasu-k1-015.mp3
02 問好	真好。	zhinˇ hooˆ.	很好。	oikasu-k1-016.mp3
03 相遇	恁堵好堵著你。	nginˆ duˆ-hooˆ duˆ-choo henˋ.	那麼剛好遇到你。	oikasu-k1-017.mp3
03 相遇	係啊！恁堵好堵著。	he aˆ! nginˆ duˆ-hooˆ duˆ--choo.	是呀！那麼剛好遇到。	oikasu-k1-018.mp3
03 相遇	你嘛來哦？	henˋ maˇ loiˋ oo?	你也來喔？	oikasu-k1-019.mp3
03 相遇	係啊！	he aˆ!	是呀！	oikasu-k1-020.mp3
03 相遇	你嘛在這。	henˋ maˇ da liaˊ.	你也在這裡。	oikasu-k1-021.mp3
03 相遇	係啊！你嘛來這。	he aˆ! henˋ maˇ loiˋ liaˊ.	是呀！你也來這裡。	oikasu-k1-022.mp3
04 道別	有閒正來尞。	rhiuˇ heenˋ zhangˆ-loiˋ-leeu.	有空再來玩。	oikasu-k1-023.mp3
04 道別	好，勞力。	hooˆ, looˆ-ladˋ.	好，謝謝。	oikasu-k1-024.mp3
04 道別	有閒擱來。	rhiuˇ heenˋ gooˊ loiˋ.	有空再來。	oikasu-k1-025.mp3
04 道別	好，𠊎行啊。	hooˆ, ngaiˋ hangˋ aˆ.	好，我走了喔。	oikasu-k1-026.mp3
04 道別	你麼个時務會擱來？	henˋ bbooˊ-gaiˆ shiˋ-bbu bbue gooˊ loiˋ?	你什麼時候會再來？	oikasu-k1-027.mp3
04 道別	𠊎有閒會擱來。	ngaiˋ rhiuˇ heenˋ bbue gooˊ loiˋ.	我有空就會再來。	oikasu-k1-028.mp3
04 道別	你寬行！	henˋ kuanˇ hangˋ!	你慢走！	oikasu-k1-029.mp3
04 道別	好，來去。	hooˆ, loiˋ-kuiˆ.	好，來去。	oikasu-k1-030.mp3
05 行禮	起立。	kiˆ-libˋ.	起立。	oikasu-k1-031.mp3
05 行禮	立正。	libˋ-zhangˆ.	立正。	oikasu-k1-032.mp3
05 行禮	行禮。	hangˋ-liˆ.	敬禮。	oikasu-k1-033.mp3
05 行禮	先生好。	sienˇ-senˇ hooˆ.	老師好。	oikasu-k1-034.mp3
05 行禮	先生勞力。	sienˇ-senˇ looˆ-ladˋ.	老師謝謝。	oikasu-k1-035.mp3
05 行禮	請坐。	ciangˆ cooˇ.	請坐。	oikasu-k1-036.mp3
06 感謝	勞力！	looˆ-ladˋ!	謝謝！	oikasu-k1-037.mp3
06 感謝	感謝！	gamˆ-cia!	感謝！	oikasu-k1-038.mp3
06 感謝	好得有你！	hooˆ-dedˊ rhiuˇ henˋ!	幸好有你！	oikasu-k1-039.mp3
06 感謝	有你真好！	rhiuˇ henˋ zhinˇ hooˆ!	有你真好！	oikasu-k1-040.mp3
06 感謝	你真好心！	henˋ zhinˇ hooˆ-simˇ!	你真好心！	oikasu-k1-041.mp3
06 感謝	實在真感謝！	shidˋ-cai zhinˇ gamˆ-cia!	實在真感謝！	oikasu-k1-042.mp3
06 感謝	感謝你鬥相共𠊎恁多！	gamˆ-cia henˋ deuˆ-siongˇ-kung ngaiˋ nginˆ dooˇ!	感謝你幫我這麼多！	oikasu-k1-043.mp3
06 感謝	毋使細義！	m-suˆ seˆ-ngi!	不必客氣！	oikasu-k1-044.mp3
07 等候	你在等哪儕？	henˋ da denˆ ni-saˋ?	你在等誰？	oikasu-k1-045.mp3
07 等候	𠊎在等同學。	ngaiˋ da denˆ tungˋ-hoo.	我在等同學。	oikasu-k1-046.mp3
07 等候	你等幾久啊？	henˋ denˆ giˆ-giuˆ aˆ?	你等多久了？	oikasu-k1-047.mp3
07 等候	𠊎等十分鐘啊。	ngaiˋ denˆ shibˋ funˇ zhungˇ aˆ.	我等十分鐘了。	oikasu-k1-048.mp3
07 等候	擱等一下。	gooˊ denˆ--rhidˊ-ha.	再等一下。	oikasu-k1-049.mp3
07 等候	佢毋知幾時正會來。	guiˋ mˇ diˇ giˆ-shiˋ zhangˆ-bbue loiˋ.	他不知道什麼時候才會來。	oikasu-k1-050.mp3
08 問姓名	請問貴姓？	ciangˆ-munˆ guiˆ-siangˆ?	請問貴姓？	oikasu-k1-051.mp3
08 問姓名	請問你姓麼个？	ciangˆ-munˆ henˋ siangˆ bbooˊ-gaiˆ?	請問你姓什麼？	oikasu-k1-052.mp3
08 問姓名	𠊎姓廖。	ngaiˋ siangˆ leeu.	我姓廖。	oikasu-k1-053.mp3
08 問姓名	請問大名？	ciangˆ-munˆ tai-miangˋ?	請問大名？	oikasu-k1-054.mp3
08 問姓名	請問你喊做麼个名？	ciangˆ-munˆ henˋ heemˆ-zooˆ bbooˊ-gaiˆ miangˋ?	請問你叫什麼名字？	oikasu-k1-055.mp3
08 問姓名	𠊎喊做小東。	ngaiˋ heemˆ-zooˆ sioˆ dungˇ.	我叫做小東。	oikasu-k1-056.mp3
08 問姓名	真歡喜和你熟事。	zhinˇ fanˇ-hiˆ ham henˋ shiu-su.	很高興跟你認識。	oikasu-k1-057.mp3
09 問年紀	請問你幾多歲？	ciangˆ-munˆ henˋ giˆ-dooˇ-seˆ?	請問你幾歲？	oikasu-k1-058.mp3
09 問年紀	𠊎十歲。	ngaiˋ shibˋ seˆ.	我十歲。	oikasu-k1-059.mp3
09 問年紀	請問你阿哥幾多歲？	ciangˆ-munˆ henˋ aˇ-gooˇ giˆ-dooˇ-seˆ?	請問你哥哥幾歲？	oikasu-k1-060.mp3
09 問年紀	𠊎阿哥十二歲。	ngaiˋ aˇ-gooˇ shibˋ ngi seˆ.	我哥哥十二歲。	oikasu-k1-061.mp3
09 問年紀	請問你阿姊幾多歲？	ciangˆ-munˆ henˋ aˇ-ziˆ giˆ-dooˇ-seˆ?	請問你姊姊幾歲？	oikasu-k1-062.mp3
09 問年紀	𠊎阿姊十四歲。	ngaiˋ aˇ-ziˆ shibˋ siˆ seˆ.	我姊姊十四歲。	oikasu-k1-063.mp3
10 問生肖	請問你肖麼个？	ciangˆ-munˆ henˋ sioˆ bbooˊ-gaiˆ?	請問你屬什麼？	oikasu-k1-064.mp3
10 問生肖	𠊎肖猴。	ngaiˋ sioˆ heuˋ.	我屬猴。	oikasu-k1-065.mp3
10 問生肖	請問佢肖麼个？	ciangˆ-munˆ guiˋ sioˆ bbooˊ-gaiˆ?	請問他屬什麼？	oikasu-k1-066.mp3
10 問生肖	佢肖牛。	guiˋ sioˆ ngiuˋ.	他屬牛。	oikasu-k1-067.mp3
10 問生肖	啊佢肖麼个？	a guiˋ sioˆ bbooˊ-gaiˆ?	而他屬什麼？	oikasu-k1-068.mp3
10 問生肖	佢肖兔。	guiˋ sioˆ tuˆ.	他屬兔。	oikasu-k1-069.mp3
11 問年級	請問你讀幾多年？	ciangˆ-munˆ henˋ tu giˆ-dooˇ neenˋ?	請問你讀幾年級？	oikasu-k1-070.mp3
11 問年級	𠊎讀三年。	ngaiˋ tu samˇ neenˋ.	我讀三年級。	oikasu-k1-071.mp3
11 問年級	請問你弟讀幾多年？	ciangˆ-munˆ henˋ teˇ tu giˆ-dooˇ neenˋ?	請問你弟弟讀幾年級？	oikasu-k1-072.mp3
11 問年級	𠊎弟讀一年。	ngaiˋ teˇ tu rhidˊ neenˋ.	我弟弟讀一年級。	oikasu-k1-073.mp3
11 問年級	請問佢讀幾多年？	ciangˆ-munˆ guiˋ tu giˆ-dooˇ neenˋ?	請問他讀幾年級？	oikasu-k1-074.mp3
11 問年級	佢讀二年。	guiˋ tu ngi neenˋ.	他讀二年級。	oikasu-k1-075.mp3
12 問身份	佢係哪儕？	guiˋ he ni-saˋ?	他是誰？	oikasu-k1-076.mp3
12 問身份	佢係學校長。	guiˋ he hoo-hau-zhongˆ.	他是校長。	oikasu-k1-077.mp3
12 問身份	佢係主任。	guiˋ he zhiˆ-rhim.	他是主任。	oikasu-k1-078.mp3
12 問身份	佢係𠊎个先生。	guiˋ he ngaiˋ e sienˇ-senˇ.	他是我的老師。	oikasu-k1-079.mp3
12 問身份	佢係遐間店个頭家。	guiˋ he gaˊ geenˇ deemˆ e teuˋ-gaˇ.	他是那間店的老闆。	oikasu-k1-080.mp3
12 問身份	佢係董事長。	guiˋ he dungˆ-su-zhongˆ.	他是董事長。	oikasu-k1-081.mp3
12 問身份	佢係佢个阿叔。	guiˋ he guiˋ e aˇ-shuˊ.	他是他的叔叔。	oikasu-k1-082.mp3
13 問星期	今日拜幾？	ginˇ-ngidˊ baiˆ guiˆ?	今天星期幾？	oikasu-k1-083.mp3
13 問星期	今日拜一。	ginˇ-ngidˊ baiˆ-rhidˊ.	今天星期一。	oikasu-k1-084.mp3
13 問星期	韶日拜幾？	shioˋ-ngidˊ baiˆ guiˆ?	明天星期幾？	oikasu-k1-085.mp3
13 問星期	韶日拜二。	shioˋ-ngidˊ baiˆ-ngi.	明天星期二。	oikasu-k1-086.mp3
13 問星期	昨日拜幾？	caˇ-ngidˊ baiˆ guiˆ?	昨天星期幾？	oikasu-k1-087.mp3
13 問星期	昨日禮拜。	caˇ-ngidˊ leˆ-baiˆ.	昨天星期日。	oikasu-k1-088.mp3
14 問日期	今日幾多號？	ginˇ-ngidˊ giˆ-dooˇ hoo?	今天幾號？	oikasu-k1-089.mp3
14 問日期	今日十六號。	ginˇ-ngidˊ shibˋ liuˊ hoo.	今天十六號。	oikasu-k1-090.mp3
14 問日期	韶日幾多號？	shioˋ-ngidˊ giˆ-dooˇ hoo?	明天幾號？	oikasu-k1-091.mp3
14 問日期	韶日十七號。	shioˋ-ngidˊ shibˋ cidˊ hoo.	明天十七號。	oikasu-k1-092.mp3
14 問日期	昨日幾多號？	caˇ-ngidˊ giˆ-dooˇ hoo?	昨天幾號？	oikasu-k1-093.mp3
14 問日期	昨日十五號。	caˇ-ngidˊ shibˋ-mˆ hoo.	昨天十五號。	oikasu-k1-094.mp3
15 問幾點	這滿幾多點？	liˊ-manˆ giˆ-dooˇ deemˆ?	現在幾點？	oikasu-k1-095.mp3
15 問幾點	這滿八點。	liˊ-manˆ beedˊ deemˆ.	現在八點。	oikasu-k1-096.mp3
15 問幾點	這滿八點二十分。	liˊ-manˆ beedˊ deemˆ ngi shibˋ funˇ.	現在八點二十分。	oikasu-k1-097.mp3
15 問幾點	這滿九點半。	liˊ-manˆ giuˆ deemˆ banˆ.	現在九點半。	oikasu-k1-098.mp3
15 問幾點	這滿當晝十二點。	liˊ-manˆ dongˇ-zhiuˆ shibˋ ngi deemˆ.	現在中午十二點。	oikasu-k1-099.mp3
15 問幾點	這滿下晝三點。	liˊ-manˆ haˇ-zhiuˆ samˇ deemˆ.	現在下午三點。	oikasu-k1-100.mp3
15 問幾點	這滿暗夜七點。	liˊ-manˆ amˆ-rhia cidˊ deemˆ.	現在晚上七點。	oikasu-k1-101.mp3
16 趕時間	你仰子恁急？	henˋ ngiong-zuˆ nginˆ gibˊ?	你為什麼這麼急？	oikasu-k1-102.mp3
16 趕時間	𠊎在攔時間。	ngaiˋ da lanˋ-shiˋ-geenˇ.	我在趕時間。	oikasu-k1-103.mp3
16 趕時間	會赴無？	bbue fuˆ moˋ?	來得及嗎？	oikasu-k1-104.mp3
16 趕時間	驚會毋會赴。	giangˇ bbue mˇ-bboi fuˆ.	怕會來不及。	oikasu-k1-105.mp3
16 趕時間	假使毋會赴會仰子？	gaˆ-suˆ mˇ-bboi fuˆ bbue ngiong-zuˆ?	如果來不及會怎樣？	oikasu-k1-106.mp3
16 趕時間	其實嘛毋會仰子啦。	kiˋ-shidˋ maˇ mˇ-bboi ngiong-zuˆ laˇ.	其實也不會怎樣啦。	oikasu-k1-107.mp3
17 遲到	你傷慢來啊！	henˋ shiong meen loiˋ aˆ!	你太慢來了！	oikasu-k1-108.mp3
17 遲到	歹勢，𠊎傷慢來啊。	painnˆ-sheˆ, ngaiˋ shiong meen loiˋ aˆ.	不好意思，我太慢來了。	oikasu-k1-109.mp3
17 遲到	你仰子會恁慢來？	henˋ ngiong-zuˆ bbue nginˆ meen loiˋ?	你怎麼會這麼慢來？	oikasu-k1-110.mp3
17 遲到	𠊎無注意時間。	ngaiˋ moˋ zhiˆ-rhiˆ shiˋ-geenˇ.	我沒注意時間。	oikasu-k1-111.mp3
17 遲到	後回愛注意時間。	heu-fueˋ oiˆ zhiˆ-rhiˆ shiˋ-geenˇ.	下次要注意時間。	oikasu-k1-112.mp3
17 遲到	𠊎傷慢出門。	ngaiˋ shiong meen chidˊ-munˋ.	我太慢出門。	oikasu-k1-113.mp3
17 遲到	後回愛量早出門。	heu-fueˋ oiˆ liong-zooˆ chidˊ-munˋ.	下次要提早出門。	oikasu-k1-114.mp3
17 遲到	𠊎堵著塞車。	ngaiˋ duˆ choo cedˊ-chaˇ.	我遇到塞車。	oikasu-k1-115.mp3
17 遲到	無要緊，平安即好。	moˋ rhioˆ-ginˆ, pinˋ-onˇ cidˋ hooˆ.	沒關係。平安就好。	oikasu-k1-116.mp3
18 問處所	你蹛在哪位？	henˋ daiˆ da ni-bbi?	你住在哪裡？	oikasu-k1-117.mp3
18 問處所	𠊎蹛在崙背。	ngaiˋ daiˆ da lun-bueˆ.	我住在崙背。	oikasu-k1-118.mp3
18 問處所	你屋下在哪位？	henˋ bbuˊ-haˇ da ni-bbi?	你家在哪裡？	oikasu-k1-119.mp3
18 問處所	𠊎屋下在羅屋莊。	ngaiˋ bbuˊ-haˇ da looˋ-bbuˊ-zongˇ.	我家在羅厝。	oikasu-k1-120.mp3
18 問處所	學校在哪位？	hoo-hau da ni-bbi?	學校在哪裡？	oikasu-k1-121.mp3
18 問處所	學校在遐裡。	hoo-hau da gaˊ-leˆ.	學校在那邊。	oikasu-k1-122.mp3
19 問去向	先生在哪位？	sienˇ-senˇ da ni-bbi?	老師在哪裡？	oikasu-k1-123.mp3
19 問去向	先生在辦公室。	sienˇ-senˇ da peen-gungˇ-shidˊ.	老師在辦公室。	oikasu-k1-124.mp3
19 問去向	你討去哪位？	henˋ tooˆ kuiˆ ni-bbi?	你要去哪裡？	oikasu-k1-125.mp3
19 問去向	𠊎討去便所。	ngaiˋ tooˆ kuiˆ pen-suˆ.	我要去廁所。	oikasu-k1-126.mp3
19 問去向	你下晝去哪位？	henˋ haˇ-zhiuˆ kuiˆ ni-bbi?	你下午去哪裡？	oikasu-k1-127.mp3
19 問去向	𠊎下晝去學校打球。	ngaiˋ haˇ-zhiuˆ kuiˆ hoo-hau daˆ-kiuˋ.	我下午去學校打球。	oikasu-k1-128.mp3
20 距離	遐離這有幾遠？	gaˊ liˋ liaˊ rhiuˇ giˆ bbienˆ?	那裡離這裡有多遠？	oikasu-k1-129.mp3
20 距離	遐離這真近。	gaˊ liˋ liaˊ zhinˇ kunˇ.	那裡離這裡很近。	oikasu-k1-130.mp3
20 距離	遐離這真遠。	gaˊ liˋ liaˊ zhinˇ bbienˆ.	那裡離這裡很遠。	oikasu-k1-131.mp3
20 距離	會真遠無？	bbue zhinˇ bbienˆ moˋ?	會很遠嗎？	oikasu-k1-132.mp3
20 距離	毋會真遠？	mˇ-bboi zhinˇ bbienˆ?	不會很遠？	oikasu-k1-133.mp3
20 距離	近近仔定。	kunˇ-kunˇ-aˋ tenˇ.	近近的而已。	oikasu-k1-134.mp3
21 問路	請問去學校个路愛仰子行？	ciangˆ-munˆ kuiˆ hoo-hau e lu oiˆ ngiong-zuˆ hangˋ?	請問去學校的路要怎麼走？	oikasu-k1-135.mp3
21 問路	你對這裡過去。	henˋ doiˆ liˊ-leˆ gooˆ--kuiˆ.	你從這裡過去。	oikasu-k1-136.mp3
21 問路	堵著十字路口即斡捭手裡。	duˆ choo shibˋ-cu-lu-keuˆ cidˋ uanndˋ beˇ-shiuˆ-leˆ.	遇到十字路口就轉左邊。	oikasu-k1-137.mp3
21 問路	哪個十字路口？	ni-gaiˆ shibˋ-cu-lu-keuˆ?	哪一個十字路口？	oikasu-k1-138.mp3
21 問路	這裡過去第一個十字路口。	liˊ-leˆ gooˆ--kuiˆ ti rhidˊ gaiˆ shibˋ-cu-lu-keuˆ.	這裡過去第一個十字路口。	oikasu-k1-139.mp3
21 問路	了後愛擱行幾遠？	leeuˆ-heu oiˆ gooˊ hangˋ giˆ bbienˆ?	之後還要走多遠？	oikasu-k1-140.mp3
21 問路	一兩百米即到位啊。	rhidˊ liongˆ baˊ miˆ cidˋ dooˆ-bbi aˆ.	一兩百公尺就到了。	oikasu-k1-141.mp3
22 座位	𠊎个座位在位？	ngaiˋ e cooˇ-bbi da bbi?	我的座位在哪裡？	oikasu-k1-142.mp3
22 座位	你个座位在遐。	henˋ e cooˇ-bbi da gaˊ.	你的座位在那裡。	oikasu-k1-143.mp3
22 座位	你討坐哪個位。	henˋ tooˆ cooˇ ni-gaiˆ bbi.	你要坐哪個位子？	oikasu-k1-144.mp3
22 座位	𠊎討坐遐個位。	ngaiˋ tooˆ cooˇ gaˊ-gaiˆ bbi.	我要坐那個位子。	oikasu-k1-145.mp3
22 座位	這有人坐無？	liaˊ rhiuˇ nginˋ cooˇ moˋ?	這裡有人坐嗎？	oikasu-k1-146.mp3
22 座位	這有人坐。	liaˊ rhiuˇ nginˋ cooˇ.	這裡有人坐。	oikasu-k1-147.mp3
22 座位	猶有位無？	iaˋ-rhiuˇ bbi moˋ?	還有位子嗎？	oikasu-k1-148.mp3
22 座位	無位啊。	moˋ bbi aˆ.	沒有位子了。	oikasu-k1-149.mp3
23 問意願	你討無？	henˋ tooˆ moˋ?	你願意嗎？	oikasu-k1-150.mp3
23 問意願	𠊎討。	ngaiˋ tooˆ.	我願意。	oikasu-k1-151.mp3
23 問意願	𠊎毋。	ngaiˋ m.	我不願意。	oikasu-k1-152.mp3
23 問意願	你愛無？	henˋ oiˆ moˋ?	你要嗎？	oikasu-k1-153.mp3
23 問意願	𠊎愛。	ngaiˋ oiˆ.	我要。	oikasu-k1-154.mp3
23 問意願	𠊎無愛。	ngaiˋ moˋ oiˆ.	我不要。	oikasu-k1-155.mp3
23 問意願	你想討愛無？	henˋ siong-tooˆ oiˆ moˋ?	你想要嗎？	oikasu-k1-156.mp3
23 問意願	𠊎想討愛。	ngaiˋ siong-tooˆ oiˆ.	我想要。	oikasu-k1-157.mp3
23 問意願	𠊎無想討愛。	ngaiˋ moˋ siong-tooˆ oiˆ.	我不想要。	oikasu-k1-158.mp3
24 問擁有	你有幾多箍？	henˋ rhiuˇ giˆ-dooˇ keuˇ?	你有幾元？	oikasu-k1-159.mp3
24 問擁有	𠊎有五十箍。	ngaiˋ rhiuˇ mˆ shibˋ keuˇ.	我有五十元。	oikasu-k1-160.mp3
24 問擁有	你有幾多枝筆。	henˋ rhiuˇ giˆ-dooˇ giˇ bidˊ.	你有幾隻筆。	oikasu-k1-161.mp3
24 問擁有	𠊎有兩枝筆。	ngaiˋ rhiuˇ liong giˇ bidˊ.	我有兩隻筆。	oikasu-k1-162.mp3
24 問擁有	你有幾多個兄弟姊妹？	henˋ rhiuˇ giˆ-dooˇ gaiˆ shangˇ-teˇ ziˆ-moiˆ?	你有幾個兄弟姐妹？	oikasu-k1-163.mp3
24 問擁有	𠊎有三個兄弟姊妹。	ngaiˋ rhiuˇ samˇ gaiˆ shangˇ-teˇ ziˆ-moiˆ.	我有三個兄弟姐妹。	oikasu-k1-164.mp3
25 問方式	這個字愛仰子寫？	liˊ-gaiˆ cu oiˆ ngiong-zuˆ siaˆ?	這個字要怎麼寫？	oikasu-k1-165.mp3
25 問方式	像恁寫。	ciong anˊ siaˆ.	像這樣寫。	oikasu-k1-166.mp3
25 問方式	討去崙背愛仰子行？	tooˆ kuiˆ lun-bueˆ oiˆ ngiong-zuˆ hangˋ?	要去崙背要怎麼走？	oikasu-k1-167.mp3
25 問方式	對這去。	doiˆ liaˊ kuiˆ.	從這裡去。	oikasu-k1-168.mp3
25 問方式	你仰子來學校个？	henˋ ngiong-zuˆ loiˋ hoo-hau e?	你怎樣來學校的？	oikasu-k1-169.mp3
25 問方式	𠊎行路來學校。	ngaiˋ hangˋ-lu loiˋ hoo-hau.	我走路來學校。	oikasu-k1-170.mp3
26 問原因	你仰子會知？	henˋ ngiong-zuˆ bbue diˇ?	你怎麼會知道？	oikasu-k1-171.mp3
26 問原因	佢拁𠊎講个。	guiˋ gaˇ ngaiˋ gongˆ e.	他跟我說的。	oikasu-k1-172.mp3
26 問原因	你仰子在唩？	henˋ ngiong-zuˆ da bbooˆ?	你為什麼在哭？	oikasu-k1-173.mp3
26 問原因	因為𠊎个物件毋見啊。	rhinˇ-bbuiˇ ngaiˋ e mi-kien mˇ-gien aˆ.	因為我的東西不見了。	oikasu-k1-174.mp3
26 問原因	你仰子討恁做？	henˋ ngiong-zuˆ tooˆ anˊ zooˆ?	你為什麼要這樣做？	oikasu-k1-175.mp3
26 問原因	𠊎想講恁較好。	ngaiˋ siong-gongˆ anˊ kaˆ hooˆ.	我想說這樣比較好。	oikasu-k1-176.mp3
27 事實確認	正經抑假个？	zhinˆ-genˇ iaˆ gaˆ e?	真的還假的？	oikasu-k1-177.mp3
27 事實確認	正經个。	zhinˆ-genˇ e.	真的。	oikasu-k1-178.mp3
27 事實確認	假个。	gaˆ e.	假的。	oikasu-k1-179.mp3
27 事實確認	若像係正經个。	na-ciong he zhinˆ-genˇ e.	好像是真的。	oikasu-k1-180.mp3
27 事實確認	若像係假个。	na-ciong he gaˆ e.	好像是假的。	oikasu-k1-181.mp3
27 事實確認	有影抑無影？	rhiuˇ-rhiangˆ iaˆ moˋ-rhiangˆ?	真的還假的？	oikasu-k1-182.mp3
27 事實確認	有影。	rhiuˇ-rhiangˆ.	真的。	oikasu-k1-183.mp3
27 事實確認	無影。	moˋ-rhiangˆ.	假的。	oikasu-k1-184.mp3
27 事實確認	敢有影？	gamˆ rhiuˇ-rhiangˆ?	真的嗎？	oikasu-k1-185.mp3
28 認知確認	知無？	diˇ moˋ?	知道嗎？	oikasu-k1-186.mp3
28 認知確認	知。	diˇ.	知道。	oikasu-k1-187.mp3
28 認知確認	毋知。	mˇ diˇ.	不知道。	oikasu-k1-188.mp3
28 認知確認	大討知。	tai-tooˆ diˇ.	大概知道。	oikasu-k1-189.mp3
28 認知確認	無幾知。	moˋ giˆ diˇ.	不太知道。	oikasu-k1-190.mp3
28 認知確認	你知啊無？	henˋ diˇ aˆ moˋ?	你知道了嗎？	oikasu-k1-191.mp3
28 認知確認	𠊎猶毋知。	ngaiˋ iaˋ mˇ diˇ.	我還不知道。	oikasu-k1-192.mp3
28 認知確認	知麼个？	diˇ bbooˊ-gaiˆ?	知道什麼？	oikasu-k1-193.mp3
29 能力確認	會無？	bbue moˋ?	會嗎？	oikasu-k1-194.mp3
29 能力確認	會。	bbue.	會。	oikasu-k1-195.mp3
29 能力確認	毋會。	mˇ-bboi.	不會。	oikasu-k1-196.mp3
29 能力確認	大討會。	tai-tooˆ bbue.	大概會。	oikasu-k1-197.mp3
29 能力確認	無幾會。	moˋ giˆ bbue.	不太會。	oikasu-k1-198.mp3
29 能力確認	你會啊無？	henˋ bbue aˆ moˋ?	你會了嗎？	oikasu-k1-199.mp3
29 能力確認	會麼个？	bbue bbooˊ-gaiˆ?	會什麼？	oikasu-k1-200.mp3
29 能力確認	𠊎猶毋會。	ngaiˋ iaˋ mˇ-bboi.	我還不會。	oikasu-k1-201.mp3
30 溝通確認	請問你講麼个？	ciangˆ-munˆ henˋ gongˆ bbooˊ-gaiˆ?	請問你說什麼？	oikasu-k1-202.mp3
30 溝通確認	𠊎無聽著。	ngaiˋ moˋ tenˇ--choo.	我沒聽到。	oikasu-k1-203.mp3
30 溝通確認	請較大聲个。	ciangˆ kaˆ tai-shangˇ e.	請大聲一點。	oikasu-k1-204.mp3
30 溝通確認	請擱講一擺。	ciangˆ gooˊ gongˆ rhidˊ baiˆ.	請再說一次。	oikasu-k1-205.mp3
30 溝通確認	你个意思敢係恁？	henˋ e rhiˆ-suˆ gamˆ he anˊ?	你的意思是這樣嗎？	oikasu-k1-206.mp3
30 溝通確認	𠊎恁講著無？	ngaiˋ anˊ gongˆ choo--moˋ?	我這樣說對嗎？	oikasu-k1-207.mp3
30 溝通確認	𠊎个意思即係恁。	ngaiˋ e rhiˆ-suˆ cidˋ-he anˊ.	我的意思就是這樣。	oikasu-k1-208.mp3
30 溝通確認	𠊎个意思毋係恁。	ngaiˋ e rhiˆ-suˆ mˇ-he anˊ.	我的意思不是這樣。	oikasu-k1-209.mp3
31 就寢	好睡啊。	hooˆ fe aˆ.	該睡覺了。	oikasu-k1-210.mp3
31 就寢	𠊎嘛真想討睡。	ngaiˋ maˇ zhinˇ siong-tooˆ fe.	我也很想睡覺。	oikasu-k1-211.mp3
31 就寢	你攏幾多點睡？	henˋ lungˆ giˆ-dooˇ deemˆ fe?	你都幾點睡覺？	oikasu-k1-212.mp3
31 就寢	𠊎攏九點半睡。	ngaiˋ lungˆ giuˆ deemˆ banˆ fe.	我都九點半睡覺。	oikasu-k1-213.mp3
31 就寢	睡進前毋好講傷多事。	fe zinˆ-cienˋ m-hooˆ gongˆ shiong dooˇ su.	睡覺之前不要說太多話。	oikasu-k1-214.mp3
31 就寢	睡進前毋好啉傷多茶。	fe zinˆ-cienˋ m-hooˆ limˇ shiong dooˇ caˋ.	睡覺之前不要喝太多茶。	oikasu-k1-215.mp3
31 就寢	𠊎睡毋會去。	ngaiˋ fe mˇ-bboi kuiˆ.	我睡不著。	oikasu-k1-216.mp3
31 就寢	𠊎真好睡。	ngaiˋ zhinˇ hooˆ fe.	我很好睡。	oikasu-k1-217.mp3
32 洗衣服	你洗浴洗好吂？	henˋ seˆ-rhu seˆ hooˆ mangˇ?	你洗澡洗好了嗎？	oikasu-k1-218.mp3
32 洗衣服	仰子啊？	ngiong-zuˆ aˆ?	怎麼了？	oikasu-k1-219.mp3
32 洗衣服	阿依討洗衫褲啊。	aˇ-i tooˆ seˆ-samˇ-kuˆ aˆ.	媽媽要洗衣服了。	oikasu-k1-220.mp3
32 洗衣服	𠊎有拁衫褲提去洗啊。	ngaiˋ rhiuˇ gaˇ samˇ-kuˆ te kuiˆ seˆ aˆ.	我有把衣服拿去洗了。	oikasu-k1-221.mp3
32 洗衣服	你个襪有提去洗無？	henˋ e madˊ rhiuˇ te kuiˆ seˆ moˋ?	你的襪子有拿去洗嗎？	oikasu-k1-222.mp3
32 洗衣服	𠊎添放啊。	ngaiˋ teemˇ-piong aˆ.	我忘記了。	oikasu-k1-223.mp3
32 洗衣服	遐領褲嘛愛提去洗。	gaˊ liangˇ kuˆ maˇ oiˆ te kuiˆ seˆ.	那件褲子也要拿去洗。	oikasu-k1-224.mp3
32 洗衣服	好！𠊎知。	hooˆ! ngaiˋ diˇ.	好！我知道。	oikasu-k1-225.mp3
33 用餐	你屎肚會枵無？	henˋ shiˆduˆ bbue iauˇ moˋ?	你肚子會餓嗎？	oikasu-k1-226.mp3
33 用餐	𠊎屎肚真枵。	ngaiˋ shiˆduˆ zhinˇ iauˇ.	我肚子很餓。	oikasu-k1-227.mp3
33 用餐	你討食麼个？	henˋ tooˆ-shiedˋ bbooˊ-gaiˆ?	你要吃什麼？	oikasu-k1-228.mp3
33 用餐	𠊎討食飯。	ngaiˋ tooˆ shiedˋ-pon.	我要吃飯。	oikasu-k1-229.mp3
33 用餐	你討食麵無？	henˋ tooˆ-shiedˋ mien moˋ?	你要吃麵嗎？	oikasu-k1-230.mp3
33 用餐	𠊎無討食麵。	ngaiˋ moˋ tooˆ-shiedˋ mien.	我不要吃麵。	oikasu-k1-231.mp3
33 用餐	你討啉湯無？	henˋ tooˆ limˇ tongˇ moˋ?	你要喝湯嗎？	oikasu-k1-232.mp3
33 用餐	好，勞力。	hooˆ, looˆ-ladˋ.	好，謝謝。	oikasu-k1-233.mp3
34 味道	這鼻起來香香。	liaˊ pinn--kiˆ-loiˋ hiongˇ-hiongˇ.	這個聞起來香香的。	oikasu-k1-234.mp3
34 味道	這鼻起來臭臭。	liaˊ pinn--kiˆ-loiˋ chiuˆ-chiuˆ.	這個聞起來臭臭的。	oikasu-k1-235.mp3
34 味道	這鼻起來酸酸。	liaˊ pinn--kiˆ-loiˋ sonˇ-sonˇ.	這個聞起來酸酸的。	oikasu-k1-236.mp3
34 味道	這個氣味真好鼻。	liˊ-gaiˆ kiˆ-bbi zhinˇ hooˆ pinn.	這個味道很好聞。	oikasu-k1-237.mp3
34 味道	𠊎佮意這個氣味。	ngaiˋ gaˊ-rhiˆ liˊ-gaiˆ kiˆ-bbi.	我喜歡這個味道。	oikasu-k1-238.mp3
34 味道	𠊎無佮意這個氣味。	ngaiˋ moˋ gaˊ-rhiˆ liˊ-gaiˆ kiˆ-bbi.	我不喜歡這個味道。	oikasu-k1-239.mp3
34 味道	你有鼻著麼个味無？	henˋ rhiuˇ pinn choo bbooˊ-gaiˆ bbi moˋ?	你有聞到什麼味道嗎？	oikasu-k1-240.mp3
34 味道	𠊎鼻䀴望。	ngaiˋ pinn ngiangˆ-mong.	我聞看看。	oikasu-k1-241.mp3
34 味道	𠊎無鼻著。	ngaiˋ moˋ pinn--choo.	我沒有聞到。	oikasu-k1-242.mp3
35 感冒	你仰子啊？	henˋ ngiong-zuˆ aˆ?	你怎麼了？	oikasu-k1-243.mp3
35 感冒	𠊎若像感著啊。	ngaiˋ na-ciong gamˆ--choo aˆ.	我好像感冒了。	oikasu-k1-244.mp3
35 感冒	有流鼻無？	rhiuˇ lauˋ-pinn moˋ?	有流鼻涕嗎？	oikasu-k1-245.mp3
35 感冒	有流鼻。	rhiuˇ lauˋ-pinn.	有流鼻涕。	oikasu-k1-246.mp3
35 感冒	會咳嗽無？	bbue kemˋ-seuˆ moˋ?	會咳嗽嗎？	oikasu-k1-247.mp3
35 感冒	毋會咳嗽。	mˇ-bboi kemˋ-seuˆ.	不會咳嗽。	oikasu-k1-248.mp3
35 感冒	頭會疾無？	teuˋ bbue cidˋ moˋ?	頭會痛嗎？	oikasu-k1-249.mp3
35 感冒	頭毋會疾。	teuˋ mˇ-bboi cidˋ.	頭不會痛。	oikasu-k1-250.mp3
36 視力檢查	請拁正裡个目珠揞起來。	ciangˆ gaˇ zhinˆ-leˆ e mudˊ-zhiˇ emˇ--kiˆ-loiˋ.	請把右邊的眼睛遮起來。	oikasu-k1-251.mp3
36 視力檢查	請拁倒裡个目珠揞起來。	ciangˆ gaˇ dooˆ-leˆ e mudˊ-zhiˇ emˇ--kiˆ-loiˋ.	請把左邊的眼睛遮起來。	oikasu-k1-252.mp3
36 視力檢查	這係哪裡？	liaˊ he ni-leˆ?	這是哪一邊？	oikasu-k1-253.mp3
36 視力檢查	面上。	minˆ-shong.	上面。	oikasu-k1-254.mp3
36 視力檢查	矮下。	eˆ-haˇ.	下面。	oikasu-k1-255.mp3
36 視力檢查	正裡。	zhinˆ-leˆ.	右邊。	oikasu-k1-256.mp3
36 視力檢查	倒裡。	dooˆ-leˆ.	左邊。	oikasu-k1-257.mp3
36 視力檢查	這䀴會著無？	liaˊ ngiangˆ bbue choo moˋ?	這個看得到嗎？	oikasu-k1-258.mp3
36 視力檢查	𠊎䀴毋會清。	ngaiˋ ngiangˆ mˇ-bboi cinˇ.	我看不清楚。	oikasu-k1-259.mp3
36 視力檢查	𠊎䀴毋會著。	ngaiˋ ngiangˆ mˇ-bboi choo.	我看不到。	oikasu-k1-260.mp3
37 去廁所	有衛生紙無？	rhiuˇ bbui-senˇ-zhiˆ moˋ?	有衛生紙嗎？	oikasu-k1-261.mp3
37 去廁所	𠊎討去便所。	ngaiˋ tooˆ kuiˆ pen-suˆ.	我要去廁所。	oikasu-k1-262.mp3
37 去廁所	𠊎討屙屎。	ngaiˋ tooˆ ooˇ-shiˆ.	我要大便。	oikasu-k1-263.mp3
37 去廁所	𠊎討屙尿。	ngaiˋ tooˆ ooˇ-neeu.	我要小便。	oikasu-k1-264.mp3
37 去廁所	𠊎討去便所洗手下。	ngaiˋ tooˆ kuiˆ pen-suˆ seˆ-shiuˆ ha.	我去廁所洗手一下。	oikasu-k1-265.mp3
37 去廁所	𠊎討去便所洗面下。	ngaiˋ tooˆ kuiˆ pen-suˆ seˆ-mienˆ ha.	我去廁所洗臉一下。	oikasu-k1-266.mp3
37 去廁所	請問便所在哪位？	ciangˆ-munˆ pen-suˆ da ni-bbi?	請問廁所在哪裡？	oikasu-k1-267.mp3
38 剪頭髮	𠊎个頭那毛傷長啊，	ngaiˋ e teuˋ-naˋ-hmˇ shiong chongˋ aˆ,	我的頭髮太長了。	oikasu-k1-268.mp3
38 剪頭髮	𠊎討去剃頭那毛。	ngaiˋ tooˆ kuiˆ teˆ teuˋ-naˋ-hmˇ.	我要去剪頭髮。	oikasu-k1-269.mp3
38 剪頭髮	討修修个抑係剪短？	tooˆ siuˇ-siuˇ e iaˆ-he zienˆ donˆ?	你要修一修還是剪短？	oikasu-k1-270.mp3
38 剪頭髮	𠊎討剪短。	ngaiˋ tooˆ zienˆ donˆ.	我要剪短。	oikasu-k1-271.mp3
38 剪頭髮	𠊎修修即好。	ngaiˋ siuˇ-siuˇ cidˋ hooˆ.	我修一修就好。	oikasu-k1-272.mp3
38 剪頭髮	剪恁會用無？	zienˆ anˊ bbue-rhung moˋ?	剪這樣可以嗎？	oikasu-k1-273.mp3
38 剪頭髮	討擱剪較短無？	tooˆ gooˊ zienˆ kaˆ donˆ moˋ?	還要再剪短一點嗎？	oikasu-k1-274.mp3
39 看電影	你討去䀴電影無？	henˋ tooˆ kuiˆ ngiangˆ teen-rhiangˆ moˋ?	你要去看電影嗎？	oikasu-k1-275.mp3
39 看電影	好啊！有麼个電影？	hooˆ aˆ! rhiuˇ bbooˊ-gaiˆ teen-rhiangˆ?	好啊！有什麼電影？	oikasu-k1-276.mp3
39 看電影	你想討䀴哪種電影？	henˋ siong-tooˆ ngiangˆ ni-zhungˆ teen-rhiangˆ?	你想要看哪種電影？	oikasu-k1-277.mp3
39 看電影	𠊎討䀴好笑个。	ngaiˋ tooˆ ngiangˆ hooˆ sioˆ e.	我要看好笑的。	oikasu-k1-278.mp3
39 看電影	𠊎嘛想討䀴好笑个。	ngaiˋ maˇ siong-tooˆ ngiangˆ hooˆ sioˆ e.	我也想看好笑的。	oikasu-k1-279.mp3
39 看電影	人討去哪位䀴？	eenˇ--nginˋ tooˆ kuiˆ ni-bbi ngiangˆ?	我們要去哪裡看？	oikasu-k1-280.mp3
39 看電影	去𠊎屋下就近遐間。	kuiˆ ngaiˋ bbuˊ-haˇ ciu-kunˇ gaˊ geenˇ.	去我家附近那間。	oikasu-k1-281.mp3
40 音樂	你佮意流行歌無？	henˋ gaˊ-rhiˆ liuˋ-hangˋ-gooˇ moˋ?	你喜歡流行歌嗎？	oikasu-k1-282.mp3
40 音樂	𠊎佮意流行歌。	ngaiˋ gaˊ-rhiˆ liuˋ-hangˋ-gooˇ.	我喜歡流行歌。	oikasu-k1-283.mp3
40 音樂	你佮意哪種歌？	henˋ gaˊ-rhiˆ ni-zhungˆ gooˇ?	你喜歡哪種歌？	oikasu-k1-284.mp3
40 音樂	𠊎佮意較輕鬆个歌。	ngaiˋ gaˊ-rhiˆ kaˆ kiangˇ-sungˇ e gooˇ.	我喜歡輕鬆一點的歌。	oikasu-k1-285.mp3
40 音樂	啊你佮意哪種歌？	a henˋ gaˊ-rhiˆ ni-zhungˆ gooˇ?	那你喜歡哪種歌？	oikasu-k1-286.mp3
40 音樂	𠊎嘛佮意較輕鬆个歌。	ngaiˋ maˇ gaˊ-rhiˆ kaˆ kiangˇ-sungˇ e gooˇ.	我也喜歡輕鬆一點的歌。	oikasu-k1-287.mp3
40 音樂	你會唱遐條歌無？	henˋ bbue chongˆ gaˊ teeuˋ gooˇ moˋ?	你會唱那首歌嗎？	oikasu-k1-288.mp3
40 音樂	遐條歌𠊎會唱。	gaˊ teeuˋ gooˇ ngaiˋ bbue chongˆ.	那首歌我會唱。	oikasu-k1-289.mp3
41 打球	你討打球無？	henˋ tooˆ daˆ-kiuˋ moˋ?	你要打球嗎？	oikasu-k1-290.mp3
41 打球	討打麼个球？	tooˆ daˆ bbooˊ-gaiˆ kiuˋ?	要打什麼球？	oikasu-k1-291.mp3
41 打球	打籃球好無？	daˆ lamˋ-kiuˋ hooˆ moˋ?	打籃球好嗎？	oikasu-k1-292.mp3
41 打球	討去哪位打？	tooˆ kuiˆ ni-bbi daˆ?	要去哪裡打？	oikasu-k1-293.mp3
41 打球	去學校打。	kuiˆ hoo-hau daˆ.	去學校打。	oikasu-k1-294.mp3
41 打球	麼个時務去？	bbooˊ-gaiˆ shiˋ-bbu kuiˆ?	什麼時候去？	oikasu-k1-295.mp3
41 打球	這滿。	liˊ-manˆ.	現在。	oikasu-k1-296.mp3
42 猜拳	人來喝拳。	eenˇ--nginˋ loiˋ hodˊ-kunˋ.	我們來猜拳。	oikasu-k1-297.mp3
42 猜拳	剪刀、石頭、紙。	zienˆ-dooˇ, sha-teuˋ, zhiˆ.	剪刀、石頭、布。	oikasu-k1-298.mp3
42 猜拳	𠊎贏。	ngaiˋ rhiangˋ.	我贏。	oikasu-k1-299.mp3
42 猜拳	𠊎輸。	ngaiˋ shiˇ.	我輸。	oikasu-k1-300.mp3
42 猜拳	擱一擺。	gooˊ rhidˊ baiˆ.	再一次。	oikasu-k1-301.mp3
42 猜拳	你傷慢出。	henˋ shiong meen chidˊ.	你太慢出。	oikasu-k1-302.mp3
42 猜拳	𠊎擱贏啊。	ngaiˋ gooˊ rhiangˋ aˆ.	我又贏了。	oikasu-k1-303.mp3
43 散步	人出去行行个。	eenˇ--nginˋ chidˊ-kuiˆ hangˋ-hangˋ--e.	我們出去走走。	oikasu-k1-304.mp3
43 散步	好，討去哪位行？	hooˆ, tooˆ kuiˆ ni-bbi hangˋ?	好，要去哪裡走。	oikasu-k1-305.mp3
43 散步	人去學校行。	eenˇ--nginˋ kuiˆ hoo-hau hangˋ.	我們去學校走。	oikasu-k1-306.mp3
43 散步	好，等𠊎一下。	hooˆ, denˆ ngaiˋ rhidˊ--ha.	好，等我一下。	oikasu-k1-307.mp3
43 散步	行行个對身體真好。	hangˋ-hangˋ--e doiˆ shinˇ-teˆ zhinˇ hooˆ.	走一走對身體很好。	oikasu-k1-308.mp3
43 散步	一日愛行幾多步？	rhidˊ ngidˊ oiˆ hangˋ giˆ-dooˇ pu?	一天要走多少步？	oikasu-k1-309.mp3
43 散步	一日愛行三千步。	rhidˊ ngidˊ oiˆ hangˋ samˇ cienˇ pu.	一天要走三千步。	oikasu-k1-310.mp3
43 散步	恁正較康健。	anˊ zhangˆ kaˆ kongˇ-kien.	這樣才比較健康。	oikasu-k1-311.mp3
44 拍照	你討翕相無？	henˋ tooˆ hibˊ-siongˆ moˋ?	你要照像嗎？	oikasu-k1-312.mp3
44 拍照	𠊎拁你翕一張。	ngaiˋ gaˇ henˋ hibˊ rhidˊ zhongˇ.	我幫你照一張。	oikasu-k1-313.mp3
44 拍照	討翕直个抑係橫个？	tooˆ hibˊ chidˋ e iaˆ-he bbangˋ e?	要拍直的還是橫的？	oikasu-k1-314.mp3
44 拍照	翕直个。	hibˊ chidˋ e.	拍直的。	oikasu-k1-315.mp3
44 拍照	嘴愛笑哦！	zheˆ oiˆ sioˆ o!	嘴要笑喔！	oikasu-k1-316.mp3
44 拍照	你翕到真好䀴。	henˋ hibˊ dooˆ zhinˇ hooˆ ngiangˆ.	你拍得很好看。	oikasu-k1-317.mp3
44 拍照	你翕相个技術真好。	henˋ hibˊ-siongˆ e giˇ-sudˋ zhinˇ hooˆ.	你拍照的技術很好！	oikasu-k1-318.mp3
45 付錢	請問幾多？	ciangˆ-munˆ giˆ-dooˇ?	請問多少？	oikasu-k1-319.mp3
45 付錢	攏總係八十箍。	lungˆ-zungˆ he beedˊ shibˋ keuˇ.	全部是八十元。	oikasu-k1-320.mp3
45 付錢	一千箍得你找。	rhidˊ cienˇ keuˇ dedˊ henˋ zau.	一千元給你找。	oikasu-k1-321.mp3
45 付錢	請問有零星錢無？	ciangˆ-munˆ rhiuˇ lenˋ-senˇ-cienˋ moˋ?	請問有零錢嗎？	oikasu-k1-322.mp3
45 付錢	歹勢，無。	painnˆ-sheˆ, moˋ.	不好意思，沒有。	oikasu-k1-323.mp3
45 付錢	收你一千。	shiuˇ henˋ rhidˊ cienˇ.	收你一千。	oikasu-k1-324.mp3
45 付錢	九百二十找你。	giuˆ baˊ ngi shibˋ zau henˋ.	九百二十元找你。	oikasu-k1-325.mp3
46 換錢	𠊎會用拁你換錢無？	ngaiˋ bbue-rhung gaˇ henˋ bban-cienˋ moˋ?	我可以跟您換錢嗎？	oikasu-k1-326.mp3
46 換錢	好，會用。	hooˆ, bbue-rhung.	好，可以。	oikasu-k1-327.mp3
46 換錢	你有銀角仔會用換無？	henˋ rhiuˇ ngunˋ-gooˊ-aˋ bbue-rhung bban moˋ?	你有硬幣可以換嗎？	oikasu-k1-328.mp3
46 換錢	你討換仰子？	henˋ tooˆ bban ngiong-zuˆ?	你要換怎樣？	oikasu-k1-329.mp3
46 換錢	你有十個十箍無？	henˋ rhiuˇ shibˋ gaiˆ shibˋ-keuˇ moˋ?	你有十個十元嗎？	oikasu-k1-330.mp3
46 換錢	有，在這。	rhiuˇ, da liaˊ.	有，在這裡。	oikasu-k1-331.mp3
46 換錢	歹勢，無。	painnˆ-sheˆ, moˋ.	不好意思，沒有。	oikasu-k1-332.mp3
47 買車票	請問車票在哪位買？	ciangˆ-munˆ chaˇ-pioˆ da ni-bbi miˇ?	請問車票在哪裡買？	oikasu-k1-333.mp3
47 買車票	𠊎討坐到斗南。	ngaiˋ tooˆ cooˇ dooˆ deuˆ-namˋ.	我要坐到斗南。	oikasu-k1-334.mp3
47 買車票	𠊎討買下晝四點个車。	ngaiˋ tooˆ miˇ haˇ-zhiuˆ siˆ deemˆ e chaˇ.	我要買下午四點的車。	oikasu-k1-335.mp3
47 買車票	遐班車無位啊。	gaˊ banˇ chaˇ moˋ bbi aˆ.	那班車沒有位子了。	oikasu-k1-336.mp3
47 買車票	下晝五點个車猶有位無？	haˇ-zhiuˆ mˆ deemˆ e chaˇ iaˋ-rhiuˇ bbi moˋ?	下午五點的車還有位子嗎？	oikasu-k1-337.mp3
47 買車票	有，你愛幾多張？	rhiuˇ, henˋ oiˆ giˆ-dooˇ zhongˇ?	有，你要幾張？	oikasu-k1-338.mp3
47 買車票	𠊎愛兩張。	ngaiˋ oiˆ liongˆ zhongˇ.	我要買兩張。	oikasu-k1-339.mp3
48 買門票	門票一張幾多？	munˋ-pioˆ rhidˊ zhongˇ giˆ-dooˇ?	門票一張多少？	oikasu-k1-340.mp3
48 買門票	一張兩百。	rhidˊ zhongˇ liongˆ baˊ.	一張兩百。	oikasu-k1-341.mp3
48 買門票	細子敢愛門票？	seˆ-zuˆ gamˆ oiˆ munˋ-pioˆ?	小孩子要門票嗎？	oikasu-k1-342.mp3
48 買門票	細子一張一百。	seˆ-zuˆ rhidˊ zhongˇ rhidˊ baˊ.	小孩子一張一百。	oikasu-k1-343.mp3
48 買門票	像恁細漢敢愛門票？	ciong nginˆ seˆ-honˆ gamˆ oiˆ munˋ-pioˆ?	像這麼小要門票嗎？	oikasu-k1-344.mp3
48 買門票	無一百二十公分毋使門票。	moˋ rhidˊ baˊ ngi shibˋ gungˇ-funˇ m-suˆ munˋ-pioˆ.	未滿一百二十公分不必門票。	oikasu-k1-345.mp3
48 買門票	𠊎討買三張門票。	ngaiˋ tooˆ miˇ samˇ zhongˇ munˋ-pioˆ.	我要買三張門票。	oikasu-k1-346.mp3
49 加汽油	請問討加麼个？	ciangˆ-munˆ tooˆ gaˇ bbooˊ-gaiˆ?	請問要加什麼？	oikasu-k1-347.mp3
49 加汽油	𠊎討加九二。	ngaiˋ tooˆ gaˇ giuˆ-ngi.	我要加九二。	oikasu-k1-348.mp3
49 加汽油	請問討加淰無？	ciangˆ-munˆ tooˆ gaˇ neemˇ moˋ?	請問要加滿嗎？	oikasu-k1-349.mp3
49 加汽油	毋使，加五百即好。	m-suˆ, gaˇ mˆ baˊ cidˋ hooˆ.	不必，加五百就好。	oikasu-k1-350.mp3
49 加汽油	九二，加五百。	giuˆ ngi, gaˇ mˆ baˊ.	九二，加五百。	oikasu-k1-351.mp3
49 加汽油	討捽窗門無？	tooˆ cudˋ cungˇ-munˋ moˋ?	要擦窗戶嗎？	oikasu-k1-352.mp3
49 加汽油	好，勞力。	hooˆ, looˆ-ladˋ.	好，謝謝。	oikasu-k1-353.mp3
50 遺失	𠊎个錢毋見啊。	ngaiˋ e cienˋ mˇ-gien aˆ.	我的錢弄丟了。	oikasu-k1-354.mp3
50 遺失	在位毋見个？	da bbi mˇ-gien e?	在那裡弄丟的？	oikasu-k1-355.mp3
50 遺失	若像在學校坪。	na-ciong da hoo-hau-piangˋ.	好像在操場。	oikasu-k1-356.mp3
50 遺失	內底有幾多箍？	nui-deˆ rhiuˇ giˆ-dooˇ keuˇ?	裡面有多少錢？	oikasu-k1-357.mp3
50 遺失	內底有三百箍。	nui-deˆ rhiuˇ samˇ baˊ keuˇ.	裡面有三百元。	oikasu-k1-358.mp3
50 遺失	你有䀴著無？	henˋ rhiuˇ ngiangˆ--choo moˋ?	你有看到嗎？	oikasu-k1-359.mp3
50 遺失	有！這係毋係你个？	rhiuˇ! liaˊ he-mˇ-he henˋ gaiˆ?	有！這是不是你的？	oikasu-k1-360.mp3
50 遺失	係！勞力！	he! looˆ-ladˋ!	是！謝謝！	oikasu-k1-361.mp3
51 找東西	你在尋麼个？	henˋ da cimˋ bbooˊ-gaiˆ?	你在找什麼？	oikasu-k1-362.mp3
51 找東西	𠊎在尋筆。	ngaiˋ da cimˋ bidˊ.	我在找筆。	oikasu-k1-363.mp3
51 找東西	你个筆有尋著無？	henˋ e bidˊ rhiuˇ cimˋ--choo moˋ?	你的筆有找到嗎？	oikasu-k1-364.mp3
51 找東西	𠊎有尋著。	ngaiˋ rhiuˇ cimˋ--choo.	我有找到。	oikasu-k1-365.mp3
51 找東西	𠊎無尋著。	ngaiˋ moˋ cimˋ--choo.	我沒找到。	oikasu-k1-366.mp3
51 找東西	你个筆在位毋見个？	henˋ e bidˊ da bbi mˇ-gien e?	你的筆在哪裡弄丟的？	oikasu-k1-367.mp3
51 找東西	𠊎記得囥在這。	ngaiˋ kiˆ-dedˊ kongˆ da liaˊ.	我記得放在這裡。	oikasu-k1-368.mp3
51 找東西	你擱想䀴望。	henˋ gooˊ siong-ngiangˆ-mong.	你再想看看。	oikasu-k1-369.mp3
51 找東西	無定著等一下即尋著啊。	moˋ-ten-choo denˆ--rhidˊ-ha cidˋ cimˋ--choo aˆ.	說不定等一下就找到了。	oikasu-k1-370.mp3
52 語言能力	你會講客事無？	henˋ bbue gongˆ kaˊ-su moˋ?	你會說客語嗎？	oikasu-k1-371.mp3
52 語言能力	𠊎毋會。	ngaiˋ mˇ-bboi.	我不會。	oikasu-k1-372.mp3
52 語言能力	𠊎正會一兜仔定。	ngaiˋ zhangˆ-bbue rhidˊ-deuˇ-aˋ tenˇ.	我只會一點點而已。	oikasu-k1-373.mp3
52 語言能力	當然會。	dongˇ-rhenˋ bbue.	當然會。	oikasu-k1-374.mp3
52 語言能力	客事你聽有無？	kaˊ-su henˋ tenˇ-rhiuˇ moˋ?	客語你聽得懂嗎？	oikasu-k1-375.mp3
52 語言能力	𠊎聽無。	ngaiˋ tenˇ-moˋ.	我聽不懂。	oikasu-k1-376.mp3
52 語言能力	𠊎聽知一兜仔。	ngaiˋ tenˇ diˇ rhidˊ-deuˇ-aˋ.	我聽得懂一點點。	oikasu-k1-377.mp3
52 語言能力	當然聽有。	dongˇ-rhenˋ tenˇ-rhiuˇ.	當然聽得懂。	oikasu-k1-378.mp3
53 語言翻譯	這个客事仰子講？	liaˊ e kaˊ-su ngiong-zuˆ gongˆ?	這個的客語怎麼說？	oikasu-k1-379.mp3
53 語言翻譯	遐个客事仰子講？	gaˊ e kaˊ-su ngiong-zuˆ gongˆ?	那個的客語怎麼說？	oikasu-k1-380.mp3
53 語言翻譯	即係恁講。	cidˋ-he anˊ gongˆ.	就是這樣講。	oikasu-k1-381.mp3
53 語言翻譯	這個字係麼个意思？	liˊ-gaiˆ cu he bbooˊ-gaiˆ rhiˆ-suˆ?	這個字是什麼意思？	oikasu-k1-382.mp3
53 語言翻譯	遐句事係麼个意思？	gaˊ guiˆ su he bbooˊ-gaiˆ rhiˆ-suˆ?	那句話是什麼意思？	oikasu-k1-383.mp3
53 語言翻譯	即係這個意思。	cidˋ-he liˊ-gaiˆ rhiˆ-suˆ.	就是這個意思。	oikasu-k1-384.mp3
54 數學加減	一加一係幾多？	rhidˊ gaˇ rhidˊ he giˆ-dooˇ?	一加一是多少？	oikasu-k1-385.mp3
54 數學加減	一加一係二。	rhidˊ gaˇ rhidˊ he ngi.	一加一是二。	oikasu-k1-386.mp3
54 數學加減	一加三擱加四係幾多？	rhidˊ gaˇ samˇ gooˊ gaˇ siˆ he giˆ-dooˇ?	一加三再加四是多少？	oikasu-k1-387.mp3
54 數學加減	恁係八。	anˊ he beedˊ.	這樣是八。	oikasu-k1-388.mp3
54 數學加減	八減三係幾多？	beedˊ giamˆ samˇ he giˆ-dooˇ?	八減三是多少？	oikasu-k1-389.mp3
54 數學加減	八減三係五。	beedˊ giamˆ samˇ he siˆ.	八減三是五。	oikasu-k1-390.mp3
54 數學加減	這兜歸下加起來係幾多？	liˊ--deuˇ guiˇ-ha gaˇ--kiˆ-loiˋ he giˆ-dooˇ?	這些全部加起來是多少？	oikasu-k1-391.mp3
54 數學加減	歸下係二十。	guiˇ-ha he ngi shibˋ.	全部是二十。	oikasu-k1-392.mp3
55 數學數量	這有幾多個人？	liaˊ rhiuˇ giˆ-dooˇ gaiˆ nginˋ?	這裡有幾個人？	oikasu-k1-393.mp3
55 數學數量	這有三十個。	liaˊ rhiuˇ samˇ shibˋ gaiˆ.	這裡有三十個。	oikasu-k1-394.mp3
55 數學數量	遐有幾多個？	gaˊ rhiuˇ giˆ-dooˇ gaiˆ?	那裡有多少個？	oikasu-k1-395.mp3
55 數學數量	遐嘛有三十個。	gaˊ maˇ rhiuˇ samˇ shibˋ gaiˆ.	那裡也有三十個。	oikasu-k1-396.mp3
55 數學數量	攏總有幾多個人？	lungˆ-zungˆ rhiuˇ giˆ-dooˇ gaiˆ nginˋ?	全部有多少人？	oikasu-k1-397.mp3
55 數學數量	攏總有六十個。	lungˆ-zungˆ rhiuˇ liuˊ shibˋ gaiˆ.	全部有六十個。	oikasu-k1-398.mp3
56 大小	這幾下個哪個較大？	liaˊ giˆ-ha gaiˆ ni-gaiˆ kaˆ tai?	這幾個哪個比較大？	oikasu-k1-399.mp3
56 大小	這個較大。	liˊ-gaiˆ kaˆ tai.	這個較大。	oikasu-k1-400.mp3
56 大小	遐個較細。	gaˊ-gaiˆ kaˆ seˆ.	那個較小。	oikasu-k1-401.mp3
56 大小	這個比遐個大。	liˊ-gaiˆ biˆ gaˊ-gaiˆ tai.	這個比那個大。	oikasu-k1-402.mp3
56 大小	這個比遐個細。	liˊ-gaiˆ biˆ gaˊ-gaiˆ seˆ.	這個比那個小。	oikasu-k1-403.mp3
56 大小	這兩個般大。	liaˊ liongˆ gaiˆ banˇ tai.	這兩個一樣大。	oikasu-k1-404.mp3
56 大小	這兩個無平大。	liaˊ liongˆ gaiˆ moˋ piangˋ tai.	這兩個不一樣大。	oikasu-k1-405.mp3
57 點名	李東興在哪位？	liˆ-dungˇ-hinˇ da ni-bbi?	李東興在哪裡？	oikasu-k1-406.mp3
57 點名	在這。	da liaˊ.	在這裡。	oikasu-k1-407.mp3
57 點名	在遐。	da gaˊ.	在那裡。	oikasu-k1-408.mp3
57 點名	李來惠有來無？	liˆ-loiˋ-fui rhiuˇ loiˋ moˋ?	李來惠有來嗎？	oikasu-k1-409.mp3
57 點名	佢有來。	guiˋ rhiuˇ loiˋ.	他有來。	oikasu-k1-410.mp3
57 點名	佢請假無來。	guiˋ ciangˆ-gaˆ moˋ loiˋ.	他請假沒來。	oikasu-k1-411.mp3
58 排隊	請到外頭排列。	ciangˆ dooˆ nguai-teuˋ peˋ-liedˋ.	請到外面排隊。	oikasu-k1-412.mp3
58 排隊	向前䀴齊。	hiongˆ cienˋ ngiangˆ-ceˋ.	向前看齊。	oikasu-k1-413.mp3
58 排隊	向前䀴。	hiongˆ cienˋ ngiangˆ.	向前看。	oikasu-k1-414.mp3
58 排隊	手㘝後。	shiuˆ ngiabˊ heu.	稍息。	oikasu-k1-415.mp3
58 排隊	齊步行。	ceˋ-pu hangˋ.	齊步走。	oikasu-k1-416.mp3
58 排隊	擋恬。	dongˆ-diamˇ.	停止。	oikasu-k1-417.mp3
59 手動作	請擎手。	ciangˆ kiaˋ-shiuˆ.	請舉手。	oikasu-k1-418.mp3
59 手動作	請放落。	ciangˆ biongˆ--loo.	請放下。	oikasu-k1-419.mp3
59 手動作	請提起來。	ciangˆ te--kiˆ-loiˋ.	請拿起來。	oikasu-k1-420.mp3
59 手動作	請放落去。	ciangˆ biongˆ--loo-kuiˆ.	請放下去。	oikasu-k1-421.mp3
59 手動作	請提好。	ciangˆ te hooˆ.	請拿好。	oikasu-k1-422.mp3
59 手動作	請揢緪。	ciangˆ ka-anˋ.	請握緊。	oikasu-k1-423.mp3
59 手動作	擊出去。	gidˋ--chidˊ-kuiˆ.	丟出去。	oikasu-k1-424.mp3
59 手動作	打出去。	daˆ--chidˊ-kuiˆ.	打出去。	oikasu-k1-425.mp3
59 手動作	接起來。	ziabˊ--kiˆ-loiˋ.	接起來。	oikasu-k1-426.mp3
60 腳動作	腳伸直。	gioˊ chinˇ chidˋ.	腳伸直。	oikasu-k1-427.mp3
60 腳動作	請跍落。	ciangˆ guˋ--loo.	請蹲下。	oikasu-k1-428.mp3
60 腳動作	請企起來。	ciangˆ kiˇ--kiˆ-loiˋ.	請站起來。	oikasu-k1-429.mp3
60 腳動作	踅膝頭。	se cidˊ-teuˋ.	繞膝蓋。	oikasu-k1-430.mp3
60 腳動作	用腳踢。	rhung gioˊ tedˊ.	用腳踢。	oikasu-k1-431.mp3
60 腳動作	用腳蹬。	rhung gioˊ deem.	用腳踩。	oikasu-k1-432.mp3
60 腳動作	行較慢个。	hangˋ kaˆ meen e.	走慢一點。	oikasu-k1-433.mp3
60 腳動作	行較緊个。	hangˋ kaˆ ginˆ e.	走快一點。	oikasu-k1-434.mp3
60 腳動作	用走个。	rhung zeuˆ e.	用跑的。	oikasu-k1-435.mp3
61 畢業	真緊即討出業啊。	zhinˇ ginˆ cidˋ-tooˆ chidˊ-ngiabˋ aˆ.	很快就要畢業了。	oikasu-k1-436.mp3
61 畢業	係啊！即討出業啊。	he aˆ! cidˋ-tooˆ chidˊ-ngiabˋ aˆ.	是呀！就要畢業了。	oikasu-k1-437.mp3
61 畢業	𠊎會思念大家。	ngaiˋ bbue suˇ-neem tai-gaˇ.	我會想念大家。	oikasu-k1-438.mp3
61 畢業	𠊎嘛係。	ngaiˋ maˇ he.	我也是。	oikasu-k1-439.mp3
61 畢業	你出業了後討讀哪位？	henˋ chidˊ-ngiabˋ leeuˆ-heu tooˆ tu ni-bbi?	你畢業之後要讀哪裡？	oikasu-k1-440.mp3
61 畢業	𠊎猶毋知。	ngaiˋ iaˋ mˇ diˇ.	我還不知道。	oikasu-k1-441.mp3
61 畢業	𠊎討讀𠊎人這个中學。	ngaiˋ tooˆ tu ngaiˋ--nginˋ liaˊ e zhungˇ-hoo.	我要讀我們這裡的國中。	oikasu-k1-442.mp3
61 畢業	後回愛恬聯絡！	heu-fueˋ oiˆ diamˇ lienˋ-loo!	以後要常聯絡！	oikasu-k1-443.mp3
1-01問好	你	henˋ	你	k001.k100
1-01問好	好	hooˆ	好	k002.k100
1-01問好	無好	moˋ-hooˆ	不好	k003.k100
1-01問好	好無	hooˆ-moˋ	好嗎	k004.k100
1-01問好	先生	sienˇ-senˇ	老師	k005.k100
1-01問好	𠢕早	ngauˋ-zooˆ	早安	k006.k100
1-01問好	大家	tai-gaˇ	大家	k007.k100
1-01問好	人客	nginˋ-kaˊ	客人	k008.k100
1-01問好	你好	henˋ-hooˆ	你好	k009.k100
1-01問好	先生𠢕早	sienˇ-senˇ-ngauˋ-zooˆ	老師早安	k010.k100
1-01問好	大家好	tai-gaˇ-hooˆ	大家好	k011.k100
1-01問好	人客好	nginˋ-kaˊ-hooˆ	客人好	k012.k100
1-02禮貌	歹勢	painnˆ-sheˆ	不好意思	k013.k100
1-02禮貌	失禮	shidˊ-liˆ	對不起	k014.k100
1-02禮貌	無要緊	moˋ-rhioˆ-ginˆ	沒關係	k015.k100
1-02禮貌	勞力	looˆ-ladˋ	謝謝	k016.k100
1-02禮貌	毋使	m-suˆ	不必	k017.k100
1-02禮貌	細義	seˆ-ngi	客氣	k018.k100
1-02禮貌	來	loiˋ	來	k019.k100
1-02禮貌	尞	leeu	玩	k020.k100
1-02禮貌	毋使細義	m-suˆ-seˆ-ngi	不必客氣	k021.k100
1-02禮貌	先生再見	sienˇ-senˇ-zaiˆ-gienˆ	老師再見	k022.k100
1-02禮貌	正來尞	zhangˆ-loiˋ-leeu	再見	k023.k100
2-03姓名	喊	heemˆ	叫	k024.k100
2-03姓名	麼个	bbooˊ-gaiˆ	什麼	k025.k100
2-03姓名	名	miangˋ	名字	k026.k100
2-03姓名	你喊做麼个名	henˋ-heemˆ-zooˆ-bbooˊ-gaiˆ-miangˋ	你叫什麼名字	k027.k100
2-03姓名	𠊎喊做李東興	ngaiˋ-heemˆ-zooˆ-liˆ-dungˇ-hinˇ	我叫做李東興	k028.k100
2-04年紀	幾多	giˆ-dooˇ	多少	k029.k100
2-04年紀	七歲	cidˊ-seˆ	七歲	k030.k100
2-04年紀	八歲	beedˊ-seˆ	八歲	k031.k100
2-04年紀	九歲	giuˆ-seˆ	九歲	k032.k100
2-04年紀	十歲	shibˋ-seˆ	十歲	k033.k100
2-04年紀	十一歲	shibˋ-rhidˊ-seˆ	十一歲	k034.k100
2-04年紀	十二歲	shibˋ-ngi-seˆ	十二歲	k035.k100
2-04年紀	你幾多歲	henˋ-giˆ-dooˇ-seˆ	你幾歲	k036.k100
2-04年紀	𠊎七歲	ngaiˋ-cidˊ-seˆ	我七歲	k037.k100
2-04年紀	𠊎八歲	ngaiˋ-beedˊ-seˆ	我八歲	k038.k100
2-04年紀	𠊎九歲	ngaiˋ-giuˆ-seˆ	我九歲	k039.k100
2-04年紀	𠊎十歲	ngaiˋ-shibˋ-seˆ	我十歲	k040.k100
2-04年紀	𠊎十一歲	ngaiˋ-shibˋ-rhidˊ-seˆ	我十一歲	k041.k100
2-04年紀	𠊎十二歲	ngaiˋ-shibˋ-ngi-seˆ	我十二歲	k042.k100
2-05年級	一年	rhidˊ-neenˋ	一年級	k043.k100
2-05年級	二年	ngi-neenˋ	二年級	k044.k100
2-05年級	三年	samˇ-neenˋ	三年級	k045.k100
2-05年級	四年	siˆ-neenˋ	四年級	k046.k100
2-05年級	五年	mˆ-neenˋ	五年級	k047.k100
2-05年級	六年	liuˊ-neenˋ	六年級	k048.k100
2-05年級	你讀幾多年	henˋ-tu-giˆ-dooˇ-neenˋ	你讀幾年級	k049.k100
2-05年級	𠊎讀一年	ngaiˋ-tu-rhidˊ-neenˋ	我讀一年級	k050.k100
2-05年級	𠊎讀二年	ngaiˋ-tu-ngi-neenˋ	我讀二年級	k051.k100
2-05年級	𠊎讀三年	ngaiˋ-tu-samˇ-neenˋ	我讀三年級	k052.k100
2-05年級	𠊎讀四年	ngaiˋ-tu-siˆ-neenˋ	我讀四年級	k053.k100
2-05年級	𠊎讀五年	ngaiˋ-tu-mˆ-neenˋ	我讀五年級	k054.k100
2-05年級	𠊎讀六年	ngaiˋ-tu-liuˊ-neenˋ	我讀六年級	k055.k100
2-06身份	佢	guiˋ	他	k056.k100
2-06身份	係	he	是	k057.k100
2-06身份	毋係	mˇ-he	不是	k058.k100
2-06身份	哪儕	ni-saˋ	誰	k059.k100
2-06身份	學校長	hoo-hau-zhongˆ	校長	k060.k100
2-06身份	主任	zhiˆ-rhim	主任	k061.k100
2-06身份	護士阿姨	fu-su-aˇ-rhiˋ	護士阿姨	k062.k100
2-06身份	灶下阿姨	zooˆ-haˇ-aˇ-rhiˋ	廚房阿姨	k063.k100
2-06身份	佢係哪儕	guiˋ-he-ni-saˋ	他是誰	k064.k100
2-06身份	佢係學校長	guiˋ-he-hoo-hau-zhongˆ	他是校長	k065.k100
2-06身份	佢係主任	guiˋ-he-zhiˆ-rhim	他是主任	k066.k100
2-06身份	佢係護士阿姨	guiˋ-he-fu-su-aˇ-rhiˋ	他是護士阿姨	k067.k100
2-06身份	佢係灶下阿姨	guiˋ-he-zooˆ-haˇ-aˇ-rhiˋ	他是廚房阿姨	k068.k100
2-07擁有	這	liaˊ	這	k069.k100
2-07擁有	𠊎个	ngaiˋ-gaiˆ	我的	k070.k100
2-07擁有	佢个	guiˋ-gaiˆ	他的	k071.k100
2-07擁有	你个	henˋ-gaiˆ	你的	k072.k100
2-07擁有	這係哪儕个	liaˊ-he-ni-saˋ-gaiˆ	這是誰的	k073.k100
2-07擁有	這係𠊎个	liaˊ-he-ngaiˋ-gaiˆ	這是我的	k074.k100
2-07擁有	這係佢个	liaˊ-he-guiˋ-gaiˆ	這是他的	k075.k100
2-07擁有	這係你个	liaˊ-he-henˋ-gaiˆ	這是你的	k076.k100
2-07擁有	有	rhiuˇ	有	k077.k100
2-07擁有	無	moˋ	沒有	k078.k100
2-07擁有	筆	bidˊ	筆	k079.k100
2-07擁有	你有筆無	henˋ-rhiuˇ-bidˊ-moˋ	你有筆嗎	k080.k100
2-07擁有	𠊎有	ngaiˋ-rhiuˇ	我有	k081.k100
2-07擁有	𠊎無	ngaiˋ-moˋ	我沒有	k082.k100
3-08星期	今日	ginˇ-ngidˊ	今天	k083.k100
3-08星期	昨日	caˇ-ngidˊ	昨天	k084.k100
3-08星期	韶日	shioˋ-ngidˊ	明天	k085.k100
3-08星期	拜一	baiˆ-rhidˊ	星期一	k086.k100
3-08星期	拜二	baiˆ-ngi	星期二	k087.k100
3-08星期	拜三	baiˆ-samˇ	星期三	k088.k100
3-08星期	拜四	baiˆ-siˆ	星期四	k089.k100
3-08星期	拜五	baiˆ-mˆ	星期五	k090.k100
3-08星期	拜六	baiˆ-liuˊ	星期六	k091.k100
3-08星期	禮拜	leˆ-baiˆ	星期日	k092.k100
3-08星期	今日拜幾	ginˇ-ngidˊ-baiˆ-guiˆ	今天星期幾	k093.k100
3-08星期	今日拜一	ginˇ-ngidˊ-baiˆ-rhidˊ	今天星期一	k094.k100
3-08星期	今日拜二	ginˇ-ngidˊ-baiˆ-ngi	今天星期二	k095.k100
3-08星期	今日拜三	ginˇ-ngidˊ-baiˆ-samˇ	今天星期三	k096.k100
3-08星期	今日拜四	ginˇ-ngidˊ-baiˆ-siˆ	今天星期四	k097.k100
3-08星期	今日拜五	ginˇ-ngidˊ-baiˆ-mˆ	今天星期五	k098.k100
3-09時間	這滿	liˊ-manˆ	現在	k099.k100
3-09時間	幾多點	giˆ-dooˇ-deemˆ	幾點	k100.k100
3-09時間	九點半	giuˆ-deemˆ-banˆ	九點半	k101.k100
3-09時間	十點半	shibˋ-deemˆ-banˆ	十點半	k102.k100
3-09時間	這滿幾多點	liˊ-manˆ-giˆ-dooˇ-deemˆ	現在幾點	k103.k100
3-09時間	這滿九點半	liˊ-manˆ-giuˆ-deemˆ-banˆ	現在九點半	k104.k100
3-09時間	這滿十點半	liˊ-manˆ-shibˋ-deemˆ-banˆ	現在十點半	k105.k100
3-09時間	請	ciangˆ	請	k106.k100
3-09時間	慢	meen	慢	k107.k100
3-09時間	緊	ginˆ	快	k108.k100
3-09時間	較慢个	kaˆ-meen-e	慢一點	k109.k100
3-09時間	請較緊个	ciangˆ-kaˆ-ginˆ-e	請快一點	k110.k100
3-09時間	請較慢个	ciangˆ-kaˆ-meen-e	請慢一點	k111.k100
3-10交通	仰子	ngiong-zuˆ	怎樣	k112.k100
3-10交通	學校	hoo-hau	學校	k113.k100
3-10交通	行	hangˋ	走	k114.k100
3-10交通	騎	kiˋ	騎	k115.k100
3-10交通	鐵馬	teedˊ-maˇ	腳踏車	k116.k100
3-10交通	坐車	cooˇ-chaˇ	坐車	k117.k100
3-10交通	用行个	rhung-hangˋ-e	用走的	k118.k100
3-10交通	騎鐵馬	kiˋ-teedˊ-maˇ	騎腳踏車	k119.k100
3-10交通	你仰子來學校个	henˋ-ngiong-zuˆ-loiˋ-hoo-hau-e	你怎樣來學校的	k120.k100
3-10交通	𠊎坐車來學校	ngaiˋ-cooˇ-chaˇ-loiˋ-hoo-hau	我坐車來學校	k121.k100
3-10交通	𠊎用行个來學校	ngaiˋ-rhung-hangˋ-e-loiˋ-hoo-hau	我用走的來學校	k122.k100
3-10交通	𠊎騎鐵馬來學校	ngaiˋ-kiˋ-teedˊ-maˇ-loiˋ-hoo-hau	我騎腳踏車來學校	k123.k100
3-11住處	蹛	daiˆ	住	k124.k100
3-11住處	在	da	在	k125.k100
3-11住處	哪位	ni-bbi	哪裡	k126.k100
3-11住處	崙背	lun-bueˆ	崙背	k127.k100
3-11住處	港尾	gongˆ-muiˇ	港尾	k128.k100
3-11住處	羅屋莊	looˋ-bbuˊ-zongˇ	羅厝	k129.k100
3-11住處	二崙子	ngi-lun-zuˆ	二崙	k130.k100
3-11住處	你蹛在哪位	henˋ-daiˆ-da-ni-bbi	你住在哪裡	k131.k100
3-11住處	𠊎蹛在崙背	ngaiˋ-daiˆ-da-lun-bueˆ	我住在崙背	k132.k100
3-11住處	𠊎蹛在港尾	ngaiˋ-daiˆ-da-gongˆ-muiˇ	我住在港尾	k133.k100
3-11住處	𠊎蹛在羅屋莊	ngaiˋ-daiˆ-da-looˋ-bbuˊ-zongˇ	我住在羅屋莊	k134.k100
3-11住處	𠊎蹛在二崙子	ngaiˋ-daiˆ-da-ngi-lun-zuˆ	我住在二崙	k135.k100
3-12去向	遐	gaˊ	那；那裡	k136.k100
3-12去向	先生在哪位	sienˇ-senˇ-da-ni-bbi	老師在哪裡	k137.k100
3-12去向	先生在遐	sienˇ-senˇ-da-gaˊ	老師在那裡	k138.k100
3-12去向	先生在這	sienˇ-senˇ-da-liaˊ	老師在這裡	k139.k100
3-12去向	討	tooˆ	要	k140.k100
3-12去向	便所	pen-suˆ	廁所	k141.k100
3-12去向	學校坪	hoo-hau-piangˋ	操場	k142.k100
3-12去向	圖書館	tuˋ-shiˇ-guanˆ	圖書館	k143.k100
3-12去向	辦公室	peen-gungˇ-shidˊ	辦公室	k144.k100
3-12去向	健康中心	kien-kongˇ-zhungˇ-simˇ	健康中心	k145.k100
3-12去向	你討去哪位	henˋ-tooˆ-kuiˆ-ni-bbi	你要去哪裡	k146.k100
3-12去向	𠊎討去便所	ngaiˋ-tooˆ-kuiˆ-pen-suˆ	我要去廁所	k147.k100
3-12去向	𠊎討去學校坪	ngaiˋ-tooˆ-kuiˆ-hoo-hau-piangˋ	我要去操場	k148.k100
3-12去向	𠊎討去圖書館	ngaiˋ-tooˆ-kuiˆ-tuˋ-shiˇ-guanˆ	我要去圖書館	k149.k100
4-13排隊	外頭	nguai-teuˋ	外面	k150.k100
4-13排隊	排列	peˋ-liedˋ	排隊	k151.k100
4-13排隊	頭前	teuˋ-cienˋ	前面	k152.k100
4-13排隊	後背	heu-bueˆ	後面	k153.k100
4-13排隊	䀴	ngiangˆ	看	k154.k100
4-13排隊	䀴齊	ngiangˆ-ceˋ	看齊	k155.k100
4-13排隊	恬	diamˇ	靜止	k156.k100
4-13排隊	請到外頭排列	ciangˆ-dooˆ-nguai-teuˋ-peˋ-liedˋ	請到外面排隊	k157.k100
4-13排隊	向前䀴齊	hiongˆ-cienˋ-ngiangˆ-ceˋ	向前看齊	k158.k100
4-13排隊	向前䀴	hiongˆ-cienˋ-ngiangˆ	向前看	k159.k100
4-13排隊	齊步行	ceˋ-pu-hangˋ	齊步走	k160.k100
4-13排隊	擋恬	dongˆ-diamˇ	停止	k161.k100
4-14動作	起立	kiˆ-libˋ	起立	k162.k100
4-14動作	立正	libˋ-zhangˆ	立正	k163.k100
4-14動作	行禮	hangˋ-liˆ	敬禮	k164.k100
4-14動作	請坐	ciangˆ-cooˇ	請坐	k165.k100
4-14動作	請擎手	ciangˆ-kiaˋ-shiuˆ	請舉手	k166.k100
4-14動作	請放落	ciangˆ-biongˆ-loo	請放下	k167.k100
4-14動作	請跍落	ciangˆ-guˋ-loo	請蹲下	k168.k100
4-14動作	請企起來	ciangˆ-kiˇ-kiˆ-loiˋ	請站起來	k169.k100
4-14動作	請過來	ciangˆ-gooˆ-loiˋ	請過來	k170.k100
4-14動作	請過去	ciangˆ-gooˆ-kuiˆ	請過去	k171.k100
4-14動作	請等下	ciangˆ-denˆ-ha	請等一下	k172.k100
5-15學習	會	bbue	會	k173.k100
5-15學習	毋會	mˇ-bboi	不會	k174.k100
5-15學習	講	gongˆ	說	k175.k100
5-15學習	客事	kaˊ-su	客語	k176.k100
5-15學習	你會無	henˋ-bbue-moˋ	你會嗎	k177.k100
5-15學習	𠊎會	ngaiˋ-bbue	我會	k178.k100
5-15學習	𠊎毋會	ngaiˋ-mˇ-bboi	我不會	k179.k100
5-15學習	你會講客事無	henˋ-bbue-gongˆ-kaˊ-su-moˋ	你會說客語嗎	k180.k100
5-15學習	𠊎會講客事	ngaiˋ-bbue-gongˆ-kaˊ-su	我會說客語	k181.k100
5-15學習	𠊎毋會講客事	ngaiˋ-mˇ-bboi-gongˆ-kaˊ-su	我不會說客語	k182.k100
5-15學習	意思	rhiˆ-suˆ	意思	k183.k100
5-15學習	擱	gooˊ	再	k184.k100
5-15學習	一遍	rhidˊ-bienˆ	一遍	k185.k100
5-15學習	這个客事仰子講	liaˊ-e-kaˊ-su-ngiong-zuˆ-gongˆ	這個的客語怎麼說	k186.k100
5-15學習	這係麼个意思	liaˊ-he-bbooˊ-gaiˆ-rhiˆ-suˆ	這是什麼意思	k187.k100
5-15學習	你講麼个	henˋ-gongˆ-bbooˊ-gaiˆ	你說什麼	k188.k100
5-15學習	請擱講一遍	ciangˆ-gooˊ-gongˆ-rhidˊ-bienˆ	請再說一次	k189.k100
5-15學習	細聲	seˆ-shangˇ	小聲	k190.k100
5-15學習	大聲	tai-shangˇ	大聲	k191.k100
5-15學習	請較大聲	ciangˆ-kaˆ-tai-shangˇ	請大聲一點	k192.k100
5-15學習	請較細聲	ciangˆ-kaˆ-seˆ-shangˇ	請小聲一點	k193.k100
5-16活動	做	zooˆ	做	k194.k100
5-16活動	寫字	siaˆ-cu	寫字	k195.k100
5-16活動	畫圖	fa-tuˋ	畫圖	k196.k100
5-16活動	䀴書	ngiangˆ-shiˇ	看書	k197.k100
5-16活動	打電話	daˆ-teen-bba	打電話	k198.k100
5-16活動	你討做麼个	henˋ-tooˆ-zooˆ-bbooˊ-gaiˆ	你要做什麼	k199.k100
5-16活動	𠊎討寫字	ngaiˋ-tooˆ-siaˆ-cu	我要寫字	k200.k100
5-16活動	𠊎討畫圖	ngaiˋ-tooˆ-fa-tuˋ	我要畫圖	k201.k100
5-16活動	𠊎討䀴書	ngaiˋ-tooˆ-ngiangˆ-shiˇ	我要看書	k202.k100
5-16活動	𠊎討打電話	ngaiˋ-tooˆ-daˆ-teen-bba	我要打電話	k203.k100
5-16活動	賞	songˆ	玩	k204.k100
5-16活動	球	kiuˋ	球	k205.k100
5-16活動	走相捎	zeuˆ-siongˇ-sauˇ	賽跑	k206.k100
5-16活動	大風吹	tai-fungˇ-cheˇ	大風吹	k207.k100
5-16活動	你討賞麼个	henˋ-tooˆ-songˆ-bbooˊ-gaiˆ	你要玩什麼	k208.k100
5-16活動	𠊎討賞球	ngaiˋ-tooˆ-songˆ-kiuˋ	我要玩球	k209.k100
5-16活動	𠊎討賞走相捎	ngaiˋ-tooˆ-songˆ-zeuˆ-siongˇ-sauˇ	我要玩賽跑	k210.k100
5-16活動	𠊎討賞大風吹	ngaiˋ-tooˆ-songˆ-tai-fungˇ-cheˇ	我要玩大風吹	k211.k100
6-17比較	贏	rhiangˋ	贏	k212.k100
6-17比較	輸	shiˇ	輸	k213.k100
6-17比較	剪刀	zienˆ-dooˇ	剪刀	k214.k100
6-17比較	石頭	sha-teuˋ	石頭	k215.k100
6-17比較	布	buˆ	布	k216.k100
6-17比較	紙	zhiˆ	紙	k217.k100
6-17比較	𠊎贏	ngaiˋ-rhiangˋ	我贏	k218.k100
6-17比較	𠊎輸	ngaiˋ-shiˇ	我輸	k219.k100
6-17比較	哪個	ni-gaiˆ	哪一個	k220.k100
6-17比較	大	tai	大	k221.k100
6-17比較	細	seˆ	細	k222.k100
6-17比較	較大	kaˆ-tai	比較大	k223.k100
6-17比較	較細	kaˆ-seˆ	比較小	k224.k100
6-17比較	哪個較大	ni-gaiˆ-kaˆ-tai	哪個比較大	k225.k100
6-17比較	這個較大	liˊ-gaiˆ-kaˆ-tai	這個比較大	k226.k100
6-17比較	這個較細	liˊ-gaiˆ-kaˆ-seˆ	這個比較小	k227.k100
6-18算數	人	nginˋ	人	k228.k100
6-18算數	一個	rhidˊ-gaiˆ	一個	k229.k100
6-18算數	兩個	liongˆ-gaiˆ	兩個	k230.k100
6-18算數	三個	samˇ-gaiˆ	三個	k231.k100
6-18算數	四個	siˆ-gaiˆ	四個	k232.k100
6-18算數	五個	mˆ-gaiˆ	五個	k233.k100
6-18算數	加	gaˇ	加	k234.k100
6-18算數	減	giamˆ	減	k235.k100
6-18算數	這有幾多個人	liaˊ-rhiuˇ-giˆ-dooˇ-gaiˆ-nginˋ	這裡有幾個人	k236.k100
6-18算數	這有兩個人	liaˊ-rhiuˇ-liongˆ-gaiˆ-nginˋ	這裡有兩個人	k237.k100
6-18算數	這有三個人	liaˊ-rhiuˇ-samˇ-gaiˆ-nginˋ	這裡有三個人	k238.k100
6-18算數	這有四個人	liaˊ-rhiuˇ-siˆ-gaiˆ-nginˋ	這裡有四個人	k239.k100
6-18算數	這有五個人	liaˊ-rhiuˇ-mˆ-gaiˆ-nginˋ	這裡有五個人	k240.k100
6-18算數	四加二係幾多	siˆ-gaˇ-ngi-he-giˆ-dooˇ	四加二是多少	k241.k100
6-18算數	四加二係六	siˆ-gaˇ-ngi-he-liuˊ	四加二是六	k242.k100
6-19顏色	白色	pa-sedˊ	白色	k243.k100
6-19顏色	烏色	bbuˇ-sedˊ	黑色	k244.k100
6-19顏色	紅色	fungˋ-sedˊ	紅色	k245.k100
6-19顏色	黃色	bbongˋ-sedˊ	黃色	k246.k100
6-19顏色	青色	ciangˇ-sedˊ	藍色	k247.k100
6-19顏色	綠豆色	liu-teu-sedˊ	綠色	k248.k100
6-19顏色	柑子色	gamˇ-zuˆ-sedˊ	橘色	k249.k100
6-19顏色	敢係	gamˆ-he	是嗎	k250.k100
6-19顏色	這係麼个色	liaˊ-he-bbooˊ-gaiˆ-sedˊ	這是什麼色	k251.k100
6-19顏色	這係紅色	liaˊ-he-fungˋ-sedˊ	這是紅色	k252.k100
6-19顏色	這係柑子色	liaˊ-he-gamˇ-zuˆ-sedˊ	這是橘色	k253.k100
6-19顏色	這係黃色	liaˊ-he-bbongˋ-sedˊ	這是黃色	k254.k100
6-19顏色	這敢係白色	liaˊ-gamˆ-he-pa-sedˊ	這是白色嗎	k255.k100
6-19顏色	這敢係青色	liaˊ-gamˆ-he-ciangˇ-sedˊ	這是藍色嗎	k256.k100
6-19顏色	這敢係烏色	liaˊ-gamˆ-he-bbuˇ-sedˊ	這是黑色嗎	k257.k100
7-20認知	知	diˇ	知道	k258.k100
7-20認知	毋知	mˇ-diˇ	不知道	k259.k100
7-20認知	你知無	henˋ-diˇ-moˋ	你知道嗎	k260.k100
7-20認知	𠊎知	ngaiˋ-diˇ	我知道	k261.k100
7-20認知	𠊎毋知	ngaiˋ-mˇ-diˇ	我不知道	k262.k100
7-20認知	愛	oiˆ	要	k263.k100
7-20認知	無愛	moˋ-oiˆ	不想要	k264.k100
7-20認知	討愛	tooˆ-oiˆ	想要	k265.k100
7-20認知	去	kuiˆ	去	k266.k100
7-20認知	毋莫	m-maiˆ	不要	k267.k100
7-20認知	你討愛無	henˋ-tooˆ-oiˆ-moˋ	你想要嗎	k268.k100
7-20認知	𠊎討愛	ngaiˋ-tooˆ-oiˆ	我想要	k269.k100
7-20認知	𠊎無愛	ngaiˋ-moˋ-oiˆ	我不想要	k270.k100
7-20認知	你討去無	henˋ-tooˆ-kuiˆ-moˋ	你要去嗎	k271.k100
7-20認知	𠊎討	ngaiˋ-tooˆ	我要	k272.k100
7-20認知	𠊎毋莫	ngaiˋ-m-maiˆ	我不要	k273.k100
8-21關心	寫	siaˆ	寫	k274.k100
8-21關心	抑	iaˆ	或	k275.k100
8-21關心	食	shiedˋ	吃	k276.k100
8-21關心	飽	bauˆ	飽	k277.k100
8-21關心	好啊	hooˆ-aˆ	好了	k278.k100
8-21關心	猶吂	iaˋ-mangˇ	還沒	k279.k100
8-21關心	你寫好吂	henˋ-siaˆ-hooˆ-mangˇ	你寫好沒	k280.k100
8-21關心	有影	rhiuˇ-rhiangˆ	真的	k281.k100
8-21關心	無影	moˋ-rhiangˆ	假的	k282.k100
8-21關心	有影抑無影	rhiuˇ-rhiangˆ-iaˆ-moˋ-rhiangˆ	真的還是假的	k283.k100
8-21關心	你食飽吂	henˋ-shiedˋ-bauˆ-mangˇ	你吃飽沒	k284.k100
8-21關心	食飽啊	shiedˋ-bauˆ-aˆ	吃飽了	k285.k100
8-21關心	𠊎猶吂食	ngaiˋ-iaˋ-mangˇ-shiedˋ	我還沒吃	k286.k100
8-21關心	𠊎食飽啊	ngaiˋ-shiedˋ-bauˆ-aˆ	我吃飽了	k287.k100
8-22健康	屎肚疾	shiˆ-duˆ-cidˋ	肚子痛	k288.k100
8-22健康	手疾	shiuˆ-cidˋ	手痛	k289.k100
8-22健康	腳疾	gioˊ-cidˋ	腳痛	k290.k100
8-22健康	牙疾	ngaˋ-cidˋ	牙痛	k291.k100
8-22健康	你仰子啊	henˋ-ngiong-zuˆ-aˆ	你怎麼了	k292.k100
8-22健康	𠊎屎肚疾	ngaiˋ-shiˆ-duˆ-cidˋ	我肚子痛	k293.k100
8-22健康	𠊎手疾	ngaiˋ-shiuˆ-cidˋ	我手痛	k294.k100
8-22健康	𠊎腳疾	ngaiˋ-gioˊ-cidˋ	我腳痛	k295.k100
8-22健康	𠊎牙疾	ngaiˋ-ngaˋ-cidˋ	我牙痛	k296.k100
8-22健康	熱	ngiedˋ	熱	k297.k100
8-22健康	寒	honˋ	冷	k298.k100
8-22健康	你會熱無	henˋ-bbue-ngiedˋ-moˋ	你會熱嗎	k299.k100
8-22健康	𠊎會熱	ngaiˋ-bbue-ngiedˋ	我會熱	k300.k100
8-22健康	𠊎毋會熱	ngaiˋ-mˇ-bboi-ngiedˋ	我不會熱	k301.k100
8-23感覺	感覺	gamˆ-gooˊ	感覺	k302.k100
8-23感覺	歡喜	fanˇ-hiˆ	高興	k303.k100
8-23感覺	無歡喜	moˋ-fanˇ-hiˆ	不高興	k304.k100
8-23感覺	真	zhinˇ	很	k305.k100
8-23感覺	靚	ziangˇ	美	k306.k100
8-23感覺	你感覺仰子	henˋ-gamˆ-gooˊ-ngiong-zuˆ	你覺得怎樣	k307.k100
8-23感覺	𠊎感覺真歡喜	ngaiˋ-gamˆ-gooˊ-zhinˇ-fanˇ-hiˆ	我覺得很高興	k308.k100
8-23感覺	𠊎感覺無歡喜	ngaiˋ-gamˆ-gooˊ-moˋ-fanˇ-hiˆ	我覺得不高興	k309.k100
8-23感覺	真好䀴	zhinˇ-hooˆ-ngiangˆ	真好看	k310.k100
8-23感覺	這真靚	liaˊ-zhinˇ-ziangˇ	這真美	k311.k100
8-23感覺	這真好䀴	liaˊ-zhinˇ-hooˆ-ngiangˆ	這真好看	k312.k100
8-24鼓勵	試	chiˆ	試	k313.k100
8-24鼓勵	一擺	rhidˊ-baiˆ	一次	k314.k100
8-24鼓勵	試一擺	chiˆ-rhidˊ-baiˆ	試一次	k315.k100
8-24鼓勵	䀴望	ngiangˆ-mong	看看	k316.k100
8-24鼓勵	擱試䀴望	gooˊ-chiˆ-ngiangˆ-mong	再試看看	k317.k100
8-24鼓勵	擱試一擺	gooˊ-chiˆ-rhidˊ-baiˆ	再試一次	k318.k100
8-24鼓勵	加油	gaˇ-rhiuˋ	加油	k319.k100
8-24鼓勵	真𠢕	zhinˇ-ngauˋ	很行	k320.k100
8-24鼓勵	真厲害	zhinˇ-li-hoi	很厲害	k321.k100
8-24鼓勵	你真會	henˋ-zhinˇ-bbue	你真會	k322.k100
8-24鼓勵	你真𠢕	henˋ-zhinˇ-ngauˋ	你很行	k323.k100
8-24鼓勵	你真厲害	henˋ-zhinˇ-li-hoi	你很厲害	k324.k100
`
