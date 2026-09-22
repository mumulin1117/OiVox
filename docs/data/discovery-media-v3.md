# OiVox 头像—音频数据对应关系 v3

来源：用户提供的 `OiVox_头像音频配对_v3`。本表只记录项目内稳定映射；来源清单中的开发机绝对路径没有写入生产代码或资源。

头像与音频来自不同素材，配对只用于本地演示数据，不表示照片人物就是录音者。人物显示名和个人资料文案也是本地虚构 fixture，不代表素材人物的真实身份。

| 配对 ID | 用户 ID | 显示名 | 国家/地区 | 语言 | 性别标签 | 头像资源 | 音频资源 | 时长 | 来源定位 |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |
| media-01-arabic-1 | user-media-01-arabic-1 | Layla | EG | ar | 女 | avatar-01-arabic-1.jpg | voice-01-arabic-1.wav | 5.860s | google/fleurs ar_eg validation#14 |
| media-02-arabic-2 | user-media-02-arabic-2 | Mariam | EG | ar | 女 | avatar-02-arabic-2.jpg | voice-02-arabic-2.wav | 6.960s | google/fleurs ar_eg validation#29 |
| media-03-arabic-3 | user-media-03-arabic-3 | Nour | EG | ar | 女 | avatar-03-arabic-3.jpg | voice-03-arabic-3.wav | 6.400s | google/fleurs ar_eg validation#35 |
| media-04-turkey-1 | user-media-04-turkey-1 | Emre | TR | tr | 男 | avatar-04-turkey-1.jpg | voice-04-turkey-1.wav | 6.720s | google/fleurs tr_tr validation#34 |
| media-05-turkey-2 | user-media-05-turkey-2 | Mert | TR | tr | 男 | avatar-05-turkey-2.jpg | voice-05-turkey-2.wav | 6.240s | google/fleurs tr_tr validation#40 |
| media-06-turkey-3 | user-media-06-turkey-3 | Kerem | TR | tr | 男 | avatar-06-turkey-3.jpg | voice-06-turkey-3.wav | 6.660s | google/fleurs tr_tr validation#76 |
| media-07-israel-1 | user-media-07-israel-1 | Ari | IL | he | 男 | avatar-07-israel-1.jpg | voice-07-israel-1.wav | 5.160s | google/fleurs he_il validation#3 |
| media-08-israel-2 | user-media-08-israel-2 | Noam | IL | he | 男 | avatar-08-israel-2.jpg | voice-08-israel-2.wav | 6.480s | google/fleurs he_il validation#4 |
| media-09-israel-3 | user-media-09-israel-3 | Eitan | IL | he | 男 | avatar-09-israel-3.jpg | voice-09-israel-3.wav | 5.160s | google/fleurs he_il validation#6 |
| media-10-uk-1 | user-media-10-uk-1 | Sophie | GB | en-GB | 女 | avatar-10-uk-1.jpg | voice-10-uk-1.wav | 6.323s | sanchit-gandhi/vctk train#8 p225 |
| media-11-uk-2 | user-media-11-uk-2 | Oliver | GB | en-GB | 男 | avatar-11-uk-2.jpg | voice-11-uk-2.wav | 6.094s | sanchit-gandhi/vctk train#468 p226 |
| media-12-uk-3 | user-media-12-uk-3 | Isla | GB | en-GB | 女 | avatar-12-uk-3.jpg | voice-12-uk-3.wav | 5.231s | sanchit-gandhi/vctk train#2694 p229 |
| media-13-france-1 | user-media-13-france-1 | Julien | FR | fr | 男 | avatar-13-france-1.jpg | voice-13-france-1.wav | 6.000s | google/fleurs fr_fr validation#1 |
| media-14-france-2 | user-media-14-france-2 | Amélie | FR | fr | 女 | avatar-14-france-2.jpg | voice-14-france-2.wav | 6.900s | google/fleurs fr_fr validation#7 |
| media-15-germany-1 | user-media-15-germany-1 | Lukas | DE | de | 男 | avatar-15-germany-1.jpg | voice-15-germany-1.wav | 6.660s | google/fleurs de_de validation#5 |
| media-16-germany-2 | user-media-16-germany-2 | Felix | DE | de | 男 | avatar-16-germany-2.jpg | voice-16-germany-2.wav | 5.400s | google/fleurs de_de validation#6 |
| media-17-japan-1 | user-media-17-japan-1 | Haruto | JP | ja | 男 | avatar-17-japan-1.jpg | voice-17-japan-1.wav | 6.600s | google/fleurs ja_jp validation#118 |
| media-18-japan-2 | user-media-18-japan-2 | Ren | JP | ja | 男 | avatar-18-japan-2.jpg | voice-18-japan-2.wav | 6.720s | google/fleurs ja_jp validation#140 |
| media-19-korea-1 | user-media-19-korea-1 | Minjun | KR | ko | 男 | avatar-19-korea-1.jpg | voice-19-korea-1.wav | 6.720s | google/fleurs ko_kr validation#37 |
| media-20-korea-2 | user-media-20-korea-2 | Junho | KR | ko | 男 | avatar-20-korea-2.png | voice-20-korea-2.wav | 6.300s | google/fleurs ko_kr validation#59 |

英国音频的语言码在运行时使用 `en`，数据来源语境为英国英语。阿拉伯语音频的国家码采用来源配置 `ar_eg` 对应的 `EG`，不把“阿拉伯”错误当作 ISO 国家码。
