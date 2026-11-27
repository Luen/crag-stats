# 日志同步

Crag Stats 通过以下两种方式之一获取你的日志：

- 使用 theCrag 赞助会员 API 密钥进行 **API 同步**。它根据现有计划运行（`SYNC_CRON`，默认每天运行一次），也可以通过 **设置 → 立即同步**（访问 **`/settings`**，或者在设置了 `APP_PASSWORD` 时先访问 **`/login`**）以及 Docker 工作器运行。配置密钥后，新安装的程序将在启动时同步。
- **手动 CSV 上传**。在 theCrag 上导出你的日志，并随时在 **设置 → CSV 导入** 中上传文件以进行更新。

## 备份：保留本地副本

你的 theCrag 账户仍然是实时日志的唯一真实来源。 Crag Stats 将同步的攀爬记录、设置、目标、线路历史缓存、天气天数和相关状态存储在 **SQLite** 中（`DATABASE_PATH`，在 Docker 中通常为 `./data/crag-stats.sqlite` 或 `/data/crag-stats.sqlite`）。将 Docker **数据卷** (或你挂载在 `/data` 的主机目录) 与你的其他 homelab 备份一起进行备份。为了获得一致的文件备份，请停止使用该数据库的所有应用和工作器，复制包含任何 `-wal` / `-shm` 辅助文件的卷，然后重新启动它们。如果在写入程序运行时逐个复制这些文件，可能会产生不一致的备份；如果你需要保持应用运行，请使用支持 SQLite 的在线备份工具。 Compose 已能在镜像升级时持久化卷。

若要获取便携的电子表格格式副本，请打开 **设置 → 隐私与数据控制**，并使用 **下载攀登日志 CSV**（操作等同于 `/settings/export`）。该文件是类 theCrag 的本地日志 CSV：线路、ticks、搭档、质量、日期和评论/注释。此下载中始终包含注释，因为这是你的备份；请像对待个人数据一样对待该文件。你可以稍后通过 **设置 → CSV 导入** 重新导入它（仅限更新/插入 — 它不会删除文件中缺失的攀爬记录）。如果你在从 theCrag 重建时需要一个回退方案，请在 **清除所有本地数据** 之前下载 CSV — 数据卷备份仍然是完整的还原路径。

设置中的 CSV 来自 Crag Stats，而不是从 theCrag 实时拉取的。对于日志本身的源头备份，请同时使用 theCrag 在线日志中的 **Action → Export logbook as CSV**。

## 手动同步导入的内容

**立即同步** 或 **完全重新同步** 成功后，“设置”页面会显示已处理的攀爬、
新攀爬、已更新的现有攀爬、新线路以及已删除的攀爬/线路。由多次攀爬共享的线路计为一条新线路。“已刷新”意味着现有的
攀爬记录被再次处理；这并不意味着其内容发生了变化。因此，未更改的日志将显示新增/删除为零，且现有攀爬
已更新。跳过的运行和错误会显示各自的消息，而不是成功摘要。

手动 CSV 上传也会显示已处理/新建/更新的计数，但绝不会删除
缺失的条目。 Route data and weather enrichment are separate background
imports: when enabled, they start after every successful sync or CSV upload
(including uploads to `POST /api/logbook/csv`), and are not included in these
logbook counts. 摘要描述的是已完成的
按钮操作；它不是持久的同步历史记录。

## API 同步

将 `THECRAG_API_KEY` 设置为你的赞助会员日志读取密钥。每次同步都会读取完整日志并比对本地攀爬记录，包括删除操作。此模式提供更丰富的线路、个人资料和多段攀登数据，且它是 Crag Stats 自动联系 theCrag 获取日志的唯一方式。

### 如果 API 同步失败

“设置”页面会显示失败，并保留上次成功同步的时间。当 theCrag 报告原因时，消息会指明原因，后跟 theCrag 的简短错误代码（例如 `invalid-api-key`）：

- **无效密钥：** theCrag 拒绝了 `THECRAG_API_KEY`。检查是否存在拼写错误，或者如果已过期或被撤销，请更换密钥，然后重启服务器。
- **访问被拒绝：** 该密钥缺少日志读取权限。检查你的赞助会员密钥，或者改为手动上传导出的 CSV（见下文）。
- **使用限制：** 该密钥已达到 theCrag 的请求限制。等待其重置，然后再次同步。

如果后面的页面失败，前面页面的更新仍会保留在缓存中，但不会删除任何缺失的攀爬记录，且此次运行不会被标记为成功。下次计划运行（默认每天运行一次）或 **立即同步** 将从第 1 页开始重试完整日志。 API 失败不会暂停计划任务。

## 手动 CSV 上传

没有赞助会员密钥？在 theCrag 上打开你的日志并选择 **Action → Export logbook as CSV**，然后在 **设置 → CSV 导入** 中上传该文件。每当你想导入新的攀爬记录时，请重复此操作。

手动上传会添加和更新攀爬，但绝不会删除文件中缺失的攀爬。若要舍弃已删除的记录，请 **清除所有本地数据** 并上传一份新的导出文件。 CSV 的字段比 API 少，包括个人资料、线路元数据和多段攀登信息较少，且不包含 theCrag 的私人攀爬注释 (`privateMarkdown`)；仅导入公开的 Comment 列。澳大利亚的纯数字抱石等级使用“国家/路径”作为 AU 提示，以免它们变成虚假的 V 等级。

线路数据导入会将 FA/FFA 荣誉与你的 theCrag 用户名进行匹配。 API 同步会从你的个人资料中保存它，在该模式下 `THECRAG_USERNAME` 会被忽略；仅限 CSV 的安装则会设置它。如果未配置用户名，导入会在获取任何内容前停止，因此请先设置用户名（也可以在攀登日志中手动标记首次攀登）。

## 带有线路数据的 CSV 日志

你可以将日志保留为 CSV 格式，同时仍拥有线路数据（受欢迎程度、攀爬次数、质量、季节性、段数）和自动 FA/FFA 标记。设置：

- `CSV_INGEST_TOKEN`：一个长的随机值。它允许容器或脚本向你发送 CSV 导出文件，因此它也告诉 Crag Stats 上传文件是日志来源：不运行 API 同步，因此上传的攀爬记录绝不会被删除，且同步绝不会写入密钥持有者的攀爬个人资料。
- `THECRAG_API_KEY`：你的赞助会员日志读取密钥，现在仅用于线路数据以及岩场/分区位置查询。
- `THECRAG_USERNAME`：你的 theCrag 用户名，以便 FA/FFA 历史记录与你匹配（CSV 导出不包含此项）。

这就是全部配置：三个值，无需切换模式。如果没有 `CSV_INGEST_TOKEN`，`THECRAG_API_KEY` 将同步日志，且线路数据共享同一密钥。 Background route and weather imports start after each successful sync or CSV upload, and also follow `IMPORT_CRON` (daily by default) rather than the logbook schedule, so a weekly or monthly `SYNC_CRON` still gets route data daily. 设置 → **导入线路数据** 显示进度并手动开始运行。

## 从另一个容器上传 CSV

手动上传对于偶尔的更新来说是可以的。如果你将导出的文件保存在网络可读的地方 — 共享文件夹、Nextcloud 或 Dropbox 共享，或是在每次导出新文件时进行上传的小型伴侣容器 — Crag Stats 可以通过 HTTP 接收它。将 `CSV_INGEST_TOKEN` 设置为一个长的随机值，重启，然后 `POST` 该文件：

```bash
curl -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" \
  --data-binary @thecrag-logbook.csv
```

使用 `file` 字段的分段上传同样有效。没有令牌的请求会被拒绝，成功的响应会报告处理了多少次攀爬以及其中有多少是新增的：

```json
{ "ok": true, "imported": 412, "created": { "routes": 318, "ascents": 412 } }
```

若要在不导入任何内容的情况下检查安装情况，请发送非导出格式的正文：

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" --data-binary 'x'
```

`400` 表示端点可达且令牌已被接受：它拒绝了正文，因此没有写入任何内容。 `401` 表示令牌不匹配，而 `404` 表示该镜像版本早于此端点。在全界面身份验证安装 (`AUTH_SCOPE=all`) 中，旧镜像会对任何未知的 `/api/` 路径返回 `401`，因此请将 `401` 理解为“令牌或镜像版本问题”。

空文件、误保存的登录页面或任何超过 25 MB 的内容都会被拒绝，而不会被导入。此端点执行与“设置”表单相同的仅限更新/插入式导入，因此它绝不会删除文件中缺失的攀爬记录。它不会向 theCrag 发送请求：导出文件仍必须来自你自己的浏览器或你控制的其他工具。

## 为什么没有自动 CSV 下载

Crag Stats 绝不会登录 theCrag 网站或为你下载导出文件。 theCrag 的[条款](https://www.thecrag.com/terms#ownership-and-licenses)要求所有程序化访问必须通过 API，且每次导出都是完整的日志转储，这会给他们的服务器带来沉重负担。自行导出并上传 CSV 是可以的。
