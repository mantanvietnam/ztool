# ZTOOL PROJECT ANALYSIS

> Phạm vi khảo sát: repository `ztool-web` tại thời điểm 2026-09-24. Báo cáo dựa trên source, cấu hình, lockfile và kết quả build/lint thực tế. Repository này chỉ chứa frontend Next.js; không có source backend, ORM schema hay migration. Những quan hệ dữ liệu nêu dưới đây được đánh dấu rõ là suy ra từ payload frontend, không phải schema database đã được xác minh.

## 1. Project Overview

ZTOOL là giao diện web cho một hệ thống Zalo Marketing Automation. Sản phẩm cho phép một tài khoản thành viên ZTOOL:

- đăng ký, đăng nhập, khôi phục/đổi mật khẩu và quản lý điểm hành động;
- kết nối nhiều tài khoản Zalo bằng QR và chuyển đổi tài khoản đang thao tác;
- đọc/cache danh sách bạn bè, lời mời đã gửi, nhóm và thành viên nhóm;
- tạo các job gửi tin, kết bạn, hủy kết bạn, thêm/mời thành viên vào nhóm;
- phân loại liên hệ bằng thẻ;
- tìm dữ liệu doanh nghiệp/địa điểm từ Google Maps, OpenStreetMap hoặc SerpApi, xuất Excel và dùng số điện thoại tìm được cho chiến dịch Zalo;
- mua điểm qua giao dịch QR ngân hàng, điểm danh và dùng mã giới thiệu;
- xem tài liệu API để tích hợp từ hệ thống bên ngoài;
- tải ứng dụng desktop/mobile của ZTOOL.

Mô hình kinh doanh quan sát được là tính điểm theo hành động. `SettingsContext` tải bảng giá động cho các thao tác, trong khi các gói nạp điểm và một số nội dung marketing vẫn hardcode ở frontend.

## 2. Tech Stack

### Frontend

| Hạng mục | Công nghệ thực tế |
|---|---|
| Framework | Next.js `15.5.12` theo lockfile; App Router trong `src/app` |
| React | React/React DOM `19.2.0` theo lockfile |
| Ngôn ngữ | TypeScript `5.9.3`, `strict: true`, `noEmit: true`, `skipLibCheck: true`; `allowJs: true` nhưng source hiện tại là TS/TSX |
| Rendering | Root layout, trang terms, wrapper register và Footer là Server Components mặc định; gần như toàn bộ page/dashboard/context còn lại là Client Components |
| CSS | Tailwind CSS `4.1.17`, `@tailwindcss/postcss`, global CSS; không có SCSS/CSS Module |
| UI | Component Tailwind tự viết; không có UI framework hoàn chỉnh |
| Icons | `react-icons` `5.5.0` |
| HTTP/data fetching | `axios` `1.13.6` và native `fetch`; không có React Query/SWR |
| State | React state + 3 Context (`Auth`, `ZaloAccount`, `Settings`); không Redux/Zustand |
| Form/validation | `useState` và validation thủ công; không React Hook Form/Zod/Yup |
| Editor | `react-quill-new` `3.8.3`, dynamic import và tắt SSR |
| Upload | Native file input + `FormData`; UI giới hạn 10 ảnh, 2 MB/ảnh, MIME bắt đầu bằng `image/` |
| Notification | `alert`, custom modal/toast và `react-hot-toast` `2.6.0` |
| Export | `exceljs` `4.4.0` chạy phía browser |
| QR | `qrcode.react` `4.2.0` |
| Analytics | `@next/third-parties` `16.1.6` cho Google Analytics |
| Table/chart | Bảng HTML tự viết; không có chart library; dashboard dùng stat card |
| Image processing | `jimp` `1.6.0` có trong dependency nhưng không được import trong source |

### Backend và hạ tầng nhìn từ frontend

- Không có Next.js Route Handler, API Route, Server Action, middleware, server service, ORM, schema database, migration, cache server hay queue implementation trong repository này.
- Frontend gọi trực tiếp hai backend tách riêng:
  - `NEXT_PUBLIC_API_URL`: API nghiệp vụ thành viên/job/điểm/thẻ/thanh toán; comment trong source gọi đây là backend PHP.
  - `NEXT_PUBLIC_BACKEND_URL`: backend automation/session Zalo và tìm kiếm bản đồ.
- Cache phía frontend là `localStorage`; queue/job processor thật nằm ngoài repository và chưa xác định từ source hiện tại.
- Email chỉ được suy ra từ luồng OTP quên mật khẩu. Nhà cung cấp email, database, cache, queue, storage file, logging, cron và webhook: **Chưa xác định từ source code hiện tại.**

### Cấu hình đáng chú ý

- `next.config.js` là cấu hình có hiệu lực trong build: remote image patterns cho avatar Zalo và CSP toàn site đã xuất hiện trong `.next/routes-manifest.json`.
- `next.config.ts` đồng thời tồn tại nhưng chỉ là placeholder rỗng; đây là file gây nhiễu và không phải cấu hình thực tế của build vừa kiểm tra.
- `eslint-config-next` đang ở `15.3.5`, thấp hơn Next `15.5.12`.
- `@next/third-parties` đang ở major `16`, cao hơn Next major `15`.
- Package manager thực tế: npm, lockfile v3.

## 3. Project Structure

```text
ztool-web/
├── public/                         # logo, favicon, avatar fallback, SVG mặc định
├── src/
│   ├── app/
│   │   ├── layout.tsx             # metadata, global CSS, Google Analytics
│   │   ├── page.tsx               # landing page
│   │   ├── login|register|logout  # auth public
│   │   ├── forgot-password/       # OTP/reset password
│   │   ├── download|terms/        # public pages
│   │   └── dashboard/
│   │       ├── layout.tsx         # providers, client auth guard, sidebar/header
│   │       ├── page.tsx           # dashboard overview
│   │       ├── api/               # UI tài liệu API, không phải API handlers
│   │       ├── tags/              # CRUD tag và thành viên tag
│   │       └── ...                # friend/group/job/map/billing/settings flows
│   ├── components/                # header/footer, account switcher, editor, guards
│   ├── contexts/                  # Auth, Zalo account, point settings
│   └── utils/stringUtils.ts       # tìm kiếm tiếng Việt không dấu
├── next.config.js                 # config thực tế
├── next.config.ts                 # placeholder trùng tên
├── eslint.config.mjs
├── postcss.config.mjs
├── tsconfig.json
├── package.json
└── package-lock.json
```

Không có `pages/`, `features/`, `modules/`, `services/`, `hooks/`, `store/`, `server/`, `actions/`, `prisma/`, `drizzle/`, `database/`, `migrations/`, `tests/` hay `e2e/`.

Repository có nhiều AppleDouble metadata file `._*` ở root, `src`, `public`, `.git` và cả output build. Đây không phải source hợp lệ nhưng hiện vẫn bị một số tool quét.

## 4. System Architecture

```text
User
  ↓
Next.js App Router UI (đa số là Client Components)
  ↓
Page-local state/modals + shared React Contexts
  ├── AuthContext: member + point
  ├── ZaloAccountContext: Zalo sessions/accounts
  └── SettingsContext: action point costs
  ↓
axios/fetch gọi trực tiếp từ browser
  ├── NEXT_PUBLIC_API_URL
  │     └── member auth, jobs, points, tags, billing, referral, DB persistence
  └── NEXT_PUBLIC_BACKEND_URL
        └── QR/session Zalo, friend/group data, map providers
  ↓
Database / job workers / Zalo / map provider / payment service
  (implementation nằm ngoài repository, chưa xác định)
```

Trách nhiệm hiện tại:

- **UI/Page:** vừa render UI, validate form, tính điểm, tạo `FormData`, gọi API, poll job, quản lý cache và điều hướng. Business logic tập trung nhiều trong page lớn.
- **Components:** chủ yếu là UI dùng lại (`MessageComposer`, headers, modal điểm danh, account switcher).
- **Contexts:** state dùng chung; không đóng vai trò API client tổng quát.
- **API/backend:** frontend giả định backend xác thực token, trừ điểm, persist job/tag/payment và vận hành queue.
- **localStorage:** lưu token, thông tin proxy, toàn bộ Zalo session, account selection và cache friend/group.

Codebase không phân service/repository/hook layer. Khi tiếp tục phát triển cần tôn trọng thực tế này; không tự áp đặt kiến trúc mới trong một thay đổi tính năng nhỏ.

## 5. Routing

Mọi route dưới `/dashboard` đi qua `src/app/dashboard/layout.tsx` và client `AuthGuard`. Không có middleware/server guard.

| Route | Chức năng | API/dữ liệu chính | Quyền theo frontend | File |
|---|---|---|---|---|
| `/` | Landing, feature, bảng giá, video | dữ liệu hardcode + env branding | Public | `src/app/page.tsx` |
| `/login` | Đăng nhập, khôi phục Zalo account đã lưu và kiểm tra session | login/member/Zalo-session APIs | Public; tự chuyển nếu token hợp lệ | `src/app/login/page.tsx` |
| `/register?aff=...` | Đăng ký + affiliate; thành công chuyển sang `/download` và hiển thị hướng dẫn cài ứng dụng | register API | Public | `src/app/register/*` |
| `/forgot-password` | Gửi OTP và đặt mật khẩu mới | forgot-password APIs | Public | `src/app/forgot-password/page.tsx` |
| `/logout` | Xóa một phần local state rồi về login | localStorage | Public | `src/app/logout/page.tsx` |
| `/terms` | Điều khoản sử dụng | static/env | Public | `src/app/terms/page.tsx` |
| `/download` | Nhận diện OS/kiến trúc và link tải app; nhận cờ redirect rồi hiển thị chúc mừng, pháo hoa và hướng dẫn một lần sau đăng ký | env/hardcoded links + query redirect | Public | `src/app/download/page.tsx` |
| `/dashboard` | Tổng quan friend/request/group và tiến độ job; điểm danh | Zalo automation + `staticDashboardAPI`, local cache | Member token | `src/app/dashboard/page.tsx` |
| `/dashboard/loginZalo` | Đăng nhập Zalo qua QR, persist session | start/status session, save Zalo info | Member token | `src/app/dashboard/loginZalo/page.tsx` |
| `/dashboard/listFriendZalo` | Danh sách/cache friend; nhắn tin, mời nhóm, hủy kết bạn | friend/group sync + message/group/delete jobs | Member + selected Zalo account | `src/app/dashboard/listFriendZalo/page.tsx` |
| `/dashboard/listWaitingFriendApproval` | Lời mời kết bạn đã gửi; hủy đơn/hàng loạt | sent-request + cancel API | Member + selected Zalo account | `src/app/dashboard/listWaitingFriendApproval/page.tsx` |
| `/dashboard/listGroupZalo` | Danh sách/cache group, filter, gửi tin group, mở bằng link | group sync + message job | Member + selected Zalo account | `src/app/dashboard/listGroupZalo/page.tsx` |
| `/dashboard/group-details/[groupId]` | Chi tiết/thành viên nhóm; gửi tin, kết bạn, thêm/mời nhóm, gán tag | group details + job/tag APIs | Member + selected Zalo account | `src/app/dashboard/group-details/[groupId]/page.tsx` |
| `/dashboard/listRequestAddFriend?page=N` | Tạo/theo dõi/pause/resume/cancel job kết bạn | add-friend job APIs | Member + selected Zalo account | `src/app/dashboard/listRequestAddFriend/page.tsx` |
| `/dashboard/listSendMessageStranger?page=N` | Tạo/theo dõi/refresh job gửi tin | send-message job APIs | Member + selected Zalo account | `src/app/dashboard/listSendMessageStranger/page.tsx` |
| `/dashboard/listRequestAddMemberGroup?page=N` | Tạo/theo dõi job thêm thành viên nhóm | add-member job + group info APIs | Member + selected Zalo account | `src/app/dashboard/listRequestAddMemberGroup/page.tsx` |
| `/dashboard/listRequestDeleteFriend?page=N` | Theo dõi job hủy kết bạn | delete-friend job APIs | Member + selected Zalo account | `src/app/dashboard/listRequestDeleteFriend/page.tsx` |
| `/dashboard/tags?page=N` | CRUD thẻ phân loại | tag APIs | Member + selected Zalo account | `src/app/dashboard/tags/page.tsx` |
| `/dashboard/tags/[id]?name=...` | Thành viên của tag; thêm/xóa và gửi tin hàng loạt | tag-member + friend + message APIs | Member + selected Zalo account | `src/app/dashboard/tags/[id]/page.tsx` |
| `/dashboard/searchOnMap` | Tìm địa điểm, GPS/autocomplete, export Excel và tạo chiến dịch | map backend + point/job APIs | Member; một số call map không mang app token | `src/app/dashboard/searchOnMap/page.tsx` |
| `/dashboard/billing` | Mua gói điểm, QR và poll giao dịch | buy/check package APIs | Member token | `src/app/dashboard/billing/page.tsx` |
| `/dashboard/referral` | Link/QR giới thiệu, đổi affiliate code | affiliate APIs + localStorage | Member token | `src/app/dashboard/referral/page.tsx` |
| `/dashboard/settings` | Xem thông tin tài khoản | member info API | Member token | `src/app/dashboard/settings/page.tsx` |
| `/dashboard/settings/password` | Đổi mật khẩu | change-password API | Member token | `src/app/dashboard/settings/password/page.tsx` |
| `/dashboard/api/add-friend` | Tài liệu API kết bạn | đọc `authTokenAPI` và Zalo userId | Member token | `src/app/dashboard/api/add-friend/page.tsx` |
| `/dashboard/api/send-message` | Tài liệu API gửi tin | như trên | Member token | `src/app/dashboard/api/send-message/page.tsx` |
| `/dashboard/api/add-group` | Tài liệu API thêm nhóm | như trên | Member token | `src/app/dashboard/api/add-group/page.tsx` |
| `/dashboard/api/add-tag` | Tài liệu API gán tag | như trên | Member token | `src/app/dashboard/api/add-tag/page.tsx` |
| `/dashboard/addFriendAuto` | Form legacy gọi `addFriendAutoAPI` không truyền token/Zalo account | legacy API | Chỉ được layout chặn | `src/app/dashboard/addFriendAuto/page.tsx` |

`/dashboard/addFriendAuto` không được link từ UI. `/dashboard/listRequestDeleteFriend` không nằm trực tiếp ở sidebar nhưng được mở từ luồng hủy bạn bè.

## 6. Authentication & Authorization

### Luồng chính

```text
User nhập phone/password
  ↓ POST checkLoginMemberAPI
authToken + authTokenAPI + user/profile/proxy
  ↓ lưu localStorage
Khôi phục và validate từng Zalo session
  ↓
/dashboard client layout
  ↓ AuthContext POST getInfoMemberAPI
Client AuthGuard render hoặc router.push('/login')
  ↓
Page gọi API bằng token trong request body
```

- Token thành viên: `authToken` trong `localStorage`; gửi trong JSON/FormData body, không dùng `Authorization` header.
- Token tích hợp: `authTokenAPI` trong `localStorage`; các trang tài liệu hiển thị/copy token này.
- Không thấy cookie auth, HttpOnly cookie, refresh token, rotation hay expiry metadata trong frontend.
- `AuthContext` gọi lại `getInfoMemberAPI` mỗi khi pathname dashboard đổi, lấy user `{id, full_name, phone, email, point, proxy}`.
- Auth guard chỉ ở client; HTML/route không được chặn bằng middleware/server auth. Bảo vệ thực sự của API phải do backend đảm nhiệm, nhưng không thể xác minh trong repo này.
- Không có role, RBAC, permission matrix hay admin route trong source frontend.
- Quyền thao tác Zalo được suy ra từ account/group hiện tại; frontend không có policy layer.
- Session Zalo gồm profile, cookie, IMEI và user-agent. `ZaloSessionGuard` kiểm tra session và xóa account khỏi local + API khi hết hạn.
- Proxy của user được chuẩn hóa thành `{id, host, port, user, pass, protocol}` và lưu `localStorage`.
- Logout không nhất quán giữa `AuthContext.logout`, `/logout`, `LogoutButton` và referral helper; một số key/cache có thể còn lại.

## 7. Database

Không có schema database/ORM/migration trong repository. Vì vậy không thể xác nhận bảng, PK, FK, index, unique constraint, enum database, soft delete hay timestamp policy.

Các entity quan sát được từ interface/payload:

- **Member/User:** `id`, `full_name`, `phone`, `email`, `point`, `affiliate_code`, token API, proxy.
- **Proxy:** `id`, `ip/host`, `port`, `username/user`, `password/pass`, `protocol`.
- **ZaloAccount:** `profile` (`userId`, `displayName`, `avatar`, ...), `session` (`cookie`, `imei`, `userAgent`, ...). Backend trả `profile` và `session` dưới dạng JSON string ở một số API.
- **Friend snapshot:** `userId`, `displayName`, `avatar`, `cover`, `phoneNumber`, `gender`, `birthday/sdob`, `isFr`, `lastActionTime`, ...
- **Group:** `id/groupId`, `name`, `avatar`, `totalMembers`, `admins`, `isCommunity`; chi tiết có `members`.
- **Automation job:** `id`, `quantity_total`, `quantity_done`, `list_request`, `list_process`, `list_done`, `list_error`, `status`, `create_at`, `update_at`; add-member job thêm `group_id`.
- **Tag:** `id`, `name`, `color`, `number_member`; tag member có record `id`, `zalo_uid_friend`, `zalo_name_friend`, `zalo_avatar_friend`.
- **Point/action setting:** `send_mess_stranger`, `send_mess_friend`, `add_friend`, `add_member_group`, `delete_friend`, `export_data_map`, `search_data_map`; code cũng dùng `send_mess_group` qua index signature.
- **Payment transaction:** `id`, QR link, bank/account metadata, amount, content, status.
- **Map result:** place ID, name, address, phone, website, rating, review count, map URL; frontend không thể hiện persistence.

Relationship nghiệp vụ suy ra từ client (không phải schema đã xác minh):

```text
Member
├── has many ZaloAccount
│   ├── has many FriendSnapshot
│   ├── has many Group ── has many GroupMember
│   ├── has many AutomationJob
│   └── has many Tag ── has many TagMember/contact
├── has many PaymentTransaction
├── has one current point balance
├── may have one Proxy
└── may have one affiliate code / referral relationships
```

PK/FK/index/unique/soft-delete/timestamp semantics: **Chưa xác định từ source code hiện tại.**

## 8. API / Server Actions

Không có Server Action hay API handler nội bộ. Tất cả endpoint dưới đây là endpoint bên ngoài được frontend gọi.

### API nghiệp vụ (`NEXT_PUBLIC_API_URL`)

| Method | Endpoint | Chức năng | Auth quan sát được | File tiêu biểu |
|---|---|---|---|---|
| POST | `/apis/checkLoginMemberAPI` | Đăng nhập | Public phone/pass | `login/page.tsx` |
| POST | `/apis/saveRegisterMemberAPI` | Đăng ký | Public | `register/RegisterForm.tsx` |
| POST | `/apis/requestForgotPasswordAPI` | Yêu cầu OTP | Public phone | `forgot-password/page.tsx` |
| POST | `/apis/createNewPasswordAPI` | Xác thực OTP/đặt mật khẩu | Public + OTP | `forgot-password/page.tsx` |
| POST | `/apis/getInfoMemberAPI` | Verify token/lấy member, điểm, proxy | `authToken` | `AuthContext`, login, settings |
| POST | `/apis/changePasswordAPI` | Đổi mật khẩu | `authToken` | `settings/password/page.tsx` |
| POST | `/apis/getListInfoZaloAPI` | Lấy account/session Zalo đã lưu | `authToken` | `login/page.tsx` |
| POST | `/apis/saveInfoZaloAPI` | Lưu account/session sau QR | `authToken` | `loginZalo/page.tsx` |
| POST | `/apis/deleteInfoZaloAPI` | Xóa Zalo account | `authToken` + Zalo userId | login/guards/switcher |
| POST | `/apis/saveZaloAccAPI` | Đồng bộ friend snapshot | `authToken` + Zalo userId | `listFriendZalo/page.tsx` |
| GET | `/apis/getPointActionAPI` | Bảng chi phí hành động | Không thấy token | `SettingsContext.tsx` |
| POST | `/apis/saveLastLoginAPI` | Điểm danh/thưởng login | `authToken` | `DailyCheckInModal.tsx` |
| POST | `/apis/staticDashboardAPI` | Thống kê tiến độ job | `authToken` + Zalo userId | `dashboard/page.tsx` |
| POST | `/apis/createRequestAddFriendAPI` | Tạo job kết bạn phone/UID | member token hoặc API token + Zalo userId | add-friend/map/group pages, API docs |
| POST | `/apis/getListRequestAddFriendAPI` | Danh sách job kết bạn | `authToken` | `listRequestAddFriend/page.tsx` |
| POST | `/apis/updateStatusRequestAddFriendAPI` | Pause/resume/cancel job kết bạn | `authToken` | cùng file |
| POST | `/apis/createRequestSendMessageAPI` | Tạo job tin nhắn stranger/friend/group + ảnh/lịch | member token hoặc API token | nhiều module, API docs |
| POST | `/apis/getListRequestSendMessageAPI` | Danh sách job gửi tin | `authToken` | `listSendMessageStranger/page.tsx` |
| POST | `/apis/updateStatusRequestSendMessageAPI` | Pause/resume/cancel job gửi tin | `authToken` | cùng file |
| POST | `/apis/refreshRequestSendMessAPI` | Làm mới job bị treo | `authToken` | cùng file |
| POST | `/apis/addMemberToGroupAPI` | Tạo job thêm/mời vào nhóm bằng phone/UID | member token hoặc API token | group/friend/map pages, API docs |
| POST | `/apis/getListRequestAddMemberToGroupAPI` | Danh sách job thêm nhóm | `authToken` | `listRequestAddMemberGroup/page.tsx` |
| POST | `/apis/updateStatusRequestAddMemberToGroupAPI` | Pause/resume/cancel job thêm nhóm | `authToken` | cùng file |
| POST | `/apis/createRequestDeleteFriendAPI` | Tạo job hủy kết bạn | `authToken` | `listFriendZalo/page.tsx` |
| POST | `/apis/getListRequestDeleteFriendAPI` | Danh sách job hủy kết bạn | `authToken` | `listRequestDeleteFriend/page.tsx` |
| POST | `/apis/updateStatusRequestDeleteFriendAPI` | Pause/resume/cancel job hủy kết bạn | `authToken` | cùng file |
| POST | `/apis/cancelFriendRequestAPI` | Hủy lời mời kết bạn đã gửi | `authToken` + Zalo userId | `listWaitingFriendApproval/page.tsx` |
| POST | `/apis/getListTagAPI` | Danh sách tag | `authToken` + Zalo userId | tag pages/group detail |
| POST | `/apis/saveTagAPI` | Tạo/cập nhật tag | `authToken` + Zalo userId | tag pages/group detail |
| POST | `/apis/deleteTagAPI` | Xóa tag | `authToken` + Zalo userId | `tags/page.tsx` |
| POST | `/apis/getListMemberTagAPI` | Thành viên tag | `authToken` + Zalo userId/tag ID | `tags/[id]/page.tsx` |
| POST | `/apis/saveMemberTagAPI` | Gán member vào tag | `authToken`/API token | tag/group detail/API docs |
| POST | `/apis/deleteMemberTagAPI` | Xóa member khỏi tag | `authToken` | `tags/[id]/page.tsx` |
| POST | `/apis/updatePointSearchMapAPI` | Ghi nhận/trừ điểm tìm map | `authToken` | `searchOnMap/page.tsx` |
| POST | `/apis/buyPackageAPI` | Tạo giao dịch mua điểm | `authToken` + amount | `billing/page.tsx` |
| POST | `/apis/checkBuyPackageAPI` | Poll trạng thái giao dịch | `authToken` + transaction ID | `billing/page.tsx` |
| POST | `/apis/checkAffiliateCodeApi` | Kiểm tra mã affiliate | `authToken` | `referral/page.tsx` |
| POST | `/apis/updateAffiliateCodeApi` | Đổi mã affiliate | `authToken` | `referral/page.tsx` |
| POST | `/apis/addFriendAutoAPI` | Endpoint legacy kết bạn | Không thấy token trong request | `addFriendAuto/page.tsx` |

### Backend automation (`NEXT_PUBLIC_BACKEND_URL`)

| Method | Endpoint | Chức năng | Auth/data quan sát được | File tiêu biểu |
|---|---|---|---|---|
| POST | `/start-login` | Tạo phiên QR Zalo | proxy; không app token | `loginZalo/page.tsx` |
| POST | `/zalo-status` | Poll QR/session | sessionId + proxy | `loginZalo/page.tsx` |
| POST | `/check-session` | Validate Zalo session | cookie/IMEI/userAgent + proxy | login/session guard |
| POST | `/get-friends` | Lấy danh sách friend | Zalo session + proxy | dashboard/friend/tag/group |
| POST | `/get-friend-count` | Đếm friend | Zalo session + proxy | job pages |
| POST | `/get-sent-friend-requests` | Lời mời đã gửi | Zalo session + proxy | dashboard/job/waiting pages |
| POST | `/get-groups` | Lấy danh sách group ID | Zalo session + proxy | dashboard/group/modals |
| POST | `/sync-groups-batch` | Lấy chi tiết group theo batch | Zalo session + batch IDs | group/modals |
| POST | `/get-group-info/[groupId]` | Info một group | Zalo session + proxy | add-member job page |
| POST | `/get-group-details/[groupId]` | Info + members | Zalo session + proxy | group detail |
| POST | `/place-autocomplete` | Gợi ý địa chỉ | input; không app token | map page |
| POST | `/get-place-detail` | Tọa độ place | placeId; không app token | map page |
| POST | `/search-places-google` | Tìm place Google | keyword/location; không app token | map page |
| POST | `/search-places-osm` | Tìm place OSM | keyword/location; không app token | map page |
| POST | `/search-places-serpapi` | Tìm place SerpApi | keyword/location; không app token | map page |

## 9. Current Modules

### Marketing/public website

- Mục đích: giới thiệu sản phẩm, feature, pricing, video, điều khoản và tải app.
- Tình trạng: hoạt động; nội dung, giá và version có nhiều phần hardcode/không đồng nhất.

### Member authentication

- Luồng: login/register/OTP → lưu token/proxy → verify member → dashboard.
- Tình trạng: hoạt động theo client; thiếu server guard/refresh token và có response-shape/logout inconsistency.

### Zalo account/session

- Luồng: start QR → poll → persist profile/session → account switcher → periodic/path-based session validation.
- Tình trạng: hoạt động; chứa dữ liệu session nhạy cảm phía client.

### Dashboard overview

- Dữ liệu: friend/request/group từ automation + job stats từ API + cache local.
- Tình trạng: hoạt động; mock news và UI news đang bị comment, version `2.5.0` hardcode.

### Friend management

- Chức năng: cache/list/search/stat friend, xem profile, gửi tin đơn/hàng loạt, mời nhóm, tạo job hủy friend.
- Tình trạng: chức năng rộng nhưng page lớn và lặp logic.

### Group/community management

- Chức năng: cache-first group sync theo batch, filter, chi tiết/member, gửi tin, kết bạn, thêm/mời member và gán tag.
- Tình trạng: hoạt động; nhiều business logic/UI trong hai page rất lớn.

### Automation job management

- Job: add friend, send message, add member group, delete friend.
- Chức năng: list/pagination/poll 60 giây, stats, pause/resume/cancel; send-message có refresh.
- Tình trạng: hoạt động; API response conventions và pagination không thống nhất.

### Tags

- Chức năng: CRUD tag, member tag, bulk message, gán member từ friend/group.
- Tình trạng: hoạt động; tài liệu public payload không khớp rõ với payload UI nội bộ.

### Map lead search

- Chức năng: geolocation, autocomplete, provider-selectable search, export Excel, tạo job message/friend/group.
- Tình trạng: UI hoàn thiện tương đối; cơ chế thu điểm có lỗi nghiệp vụ nghiêm trọng.

### Billing/points

- Chức năng: gói điểm hardcode, tạo QR transaction, poll 10 giây.
- Tình trạng: hoạt động; pricing trùng lặp/mâu thuẫn; client gửi `amount` trực tiếp.

### Referral/check-in

- Chức năng: affiliate link/QR, custom code, daily login reward, Facebook share.
- Tình trạng: có dấu hiệu chưa hoàn thiện: `react-hot-toast` không có `<Toaster />` trong tree.

### Settings

- Chức năng: xem member info và đổi password.
- Tình trạng: hoạt động cơ bản; nhiều state/component/import cũ không dùng.

### API documentation

- Chức năng: docs/copy endpoint, API token, userId và sample request.
- Tình trạng: usable nhưng lint lỗi và có điểm không đồng nhất với implementation.

## 10. Important Components

- `src/app/dashboard/layout.tsx`: composition root của dashboard; providers, auth guard, sidebar, mobile/desktop header.
- `src/contexts/AuthContext.tsx`: verify member, current points, logout, proxy sync.
- `src/contexts/ZaloAccountContext.tsx`: Zalo account list/selection/session local persistence.
- `src/contexts/SettingsContext.tsx`: tải bảng chi phí điểm.
- `src/components/MessageComposer.tsx`: Quill editor, spin/personalization variables, emoji, scheduling, image validation.
- `src/components/AccountSwitcher.tsx`: switch/add/delete Zalo account.
- `src/components/ZaloSessionGuard.tsx`: validate và dọn session Zalo hết hạn.
- `src/components/DailyCheckInModal.tsx`: thưởng đăng nhập và Facebook referral share.
- `src/components/Header.tsx` / `Footer.tsx`: public shell.
- `src/components/layout/Header.tsx`: selected account/point/billing header trong dashboard.
- `src/components/auth/AuthGuard.tsx` và `src/components/LogoutButton.tsx`: hiện không được import; dashboard có AuthGuard riêng.

Các page lớn cần đặc biệt thận trọng: group detail (1,081 dòng), map search (785), friend list (774), tag detail (683), group list (569).

## 11. Important Services / Utilities

Không có service layer hoặc shared API client. Các helper quan trọng:

- `removeVietnameseTones`: normalize tìm kiếm tên tiếng Việt.
- `getCurrentDateTimeLocal` và `formatTimeForApi`: bị duplicate ở nhiều page, format lịch gửi thành `H:i d/m/Y`.
- Cache keys: `ztool_friends_${zaloUserId}` và `ztool_groups_${zaloUserId}`.
- “Silent limit shield”: giữ cache nếu Zalo đột ngột trả 0 friend/group trong khi cache trước đó lớn.
- Group smart sync: lấy ID → diff cache → `sync-groups-batch` theo batch 5 → nghỉ 1.5 giây.
- Job polling: 60 giây; sent friend request polling: 30 giây; payment: 10 giây; Zalo QR: 3 giây.

API error contract không thống nhất: code kiểm tra cả `code === 0`, `code === 1`, `code === 3`, và đọc xen kẽ `mess`, `message`, `messages`, `data`, `infoUser`.

## 12. External Integrations

- Zalo session/QR, friend/group/community operations qua backend automation riêng.
- Google Maps, OpenStreetMap hoặc SerpApi cho lead search, chọn bằng `NEXT_PUBLIC_MAP_SOURCE`.
- Browser Geolocation API.
- Google Analytics.
- Facebook share/fanpage.
- YouTube embed/demo và channel.
- Apple App Store, Google Play, Windows/macOS/Linux download hosting.
- Payment QR/bank metadata do backend trả về; payment provider cụ thể chưa xác định.
- Email OTP được backend thực hiện; provider chưa xác định.

## 13. Environment Variables

Chỉ tên biến, không ghi giá trị:

- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_MAP_SOURCE`
- `NEXT_PUBLIC_NAME_APP`
- `NEXT_PUBLIC_PHONE`
- `NEXT_PUBLIC_EMAIL`
- `NEXT_PUBLIC_ADDRESS`
- `NEXT_PUBLIC_FACEBOOK`
- `NEXT_PUBLIC_YOUTUBE`
- `NEXT_PUBLIC_NAME_COMPANY`
- `NEXT_PUBLIC_LOGO_URL`
- `NEXT_PUBLIC_FAVICON_URL`
- `NEXT_PUBLIC_SEO_TITLE`
- `NEXT_PUBLIC_SEO_DESCRIPTION`
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_TAX`
- `NEXT_PUBLIC_CEO`
- `NEXT_PUBLIC_DATE_START`
- `NEXT_PUBLIC_LINK_WIN32`
- `NEXT_PUBLIC_LINK_WIN64`
- `NEXT_PUBLIC_LINK_WIN_ARM`
- `NEXT_PUBLIC_LINK_WIN_UNIVERSAL`
- `NEXT_PUBLIC_LINK_LINUX`
- `NEXT_PUBLIC_LINK_LINUX_ARM`
- `NEXT_PUBLIC_LINK_MAC_INTEL`
- `NEXT_PUBLIC_LINK_MAC_APPLE`

Không có `.env.example`; chỉ có `.env.local` bị ignore. Tất cả biến đang dùng đều có prefix `NEXT_PUBLIC_`, nên giá trị được bundle cho browser khi được tham chiếu.

## 14. Coding Conventions

- Component/page: PascalCase function; route folder hiện dùng camelCase (`listFriendZalo`, `searchOnMap`) lẫn kebab-case (`group-details`, API docs).
- File page theo App Router: `page.tsx`, `layout.tsx`; shared component PascalCase.
- Import alias: `@/*` → `./src/*`.
- Client component khai báo `'use client'`; gần như toàn bộ logic nghiệp vụ nằm client-side.
- Types/interfaces thường khai báo ngay đầu page; chưa có shared `types/`.
- Styling bằng chuỗi Tailwind trực tiếp trong JSX, dark theme gray/blue.
- API gọi trực tiếp bằng axios/fetch; token nằm trong body; không có interceptor hoặc response adapter.
- Form state/validation thủ công; lỗi hiển thị bằng state, `alert`, custom notification/modal.
- Action có tính phí: lấy `pointCosts` từ context, kiểm tra số dư client, gọi API, rồi `updateUserPoints` lạc quan.
- Search name dùng `removeVietnameseTones`.
- Job status hiện dùng union `process | pause | done | cancel`.
- Schedule time được format `H:i d/m/Y`.
- Message payload dùng `multipart/form-data`, `list_request` là JSON string, file key `files[]`.
- Comment trong source chủ yếu bằng tiếng Việt; code identifiers bằng tiếng Anh/camelCase.

## 15. Unfinished Work

Không tìm thấy marker `TODO`, `FIXME`, `HACK`, `TEMP`, `XXX`, `@todo`, `eslint-disable` hay `ts-ignore`. Tuy nhiên có các dấu hiệu dở dang/legacy:

- `NEWS_DATA` là mock hardcode và toàn bộ UI news bị comment.
- `/dashboard/addFriendAuto` là route legacy không có link, không truyền auth token/Zalo account và chồng chức năng với job add-friend mới.
- `src/components/auth/AuthGuard.tsx` và `src/components/LogoutButton.tsx` không dùng; AuthGuard bị duplicate trong dashboard layout.
- Settings/password chứa nhiều component, imports và state không dùng từ phiên bản cũ.
- Billing để comment `refetchUser`; điểm header dựa vào việc pathname đổi để refetch.
- Login Zalo dùng status `FAILED` cả lúc “đang lưu” và “thêm thành công”; `isMounted` được tạo nhưng không dùng.
- Referral gọi `toast.*` nhưng không có `<Toaster />` trong component tree.
- API docs add-tag mô tả field `phones`, trong khi UI nội bộ gọi cùng endpoint bằng `member` là mảng object Zalo.
- API send-message docs comment type có `friend/group`, nhưng bảng chỉ mô tả `stranger`.
- Fallback `/avatar-default.png` được tham chiếu ở nhiều nơi nhưng public chỉ có `/avatar-default-crm.png`.
- Một `catch (err) {}` nuốt lỗi ở background group sync trong friend page.
- 74 lệnh `console.log/warn/error`, 114 lần dùng explicit `any`.
- Pricing, daily reward, dashboard version, support info và download fallback được hardcode rải rác; landing/billing pricing không hoàn toàn đồng nhất.
- `jimp` không được dùng.
- README vẫn là boilerplate `create-next-app`, chưa mô tả dự án thật.
- Không có test/e2e.

## 16. Technical Issues / Risks

### Critical

1. **Bypass thu điểm ở Map Export:** `handleExport` chỉ gọi `updateUserPoints` trong React state sau khi tạo file; không có request backend để persist việc trừ `export_data_map`. Reload có thể khôi phục điểm cũ.
2. **Map search và thu điểm không atomic:** frontend gọi search backend không kèm app token, nhận kết quả trước, sau đó mới gọi `updatePointSearchMapAPI`. Nếu call trừ điểm lỗi, code chỉ log lỗi và vẫn giữ kết quả. Endpoint search cũng có thể bị gọi trực tiếp nếu backend không có lớp bảo vệ ngoài source này.

### High

1. **Dữ liệu xác thực nhạy cảm ở localStorage:** member/API token, Zalo cookie/session, IMEI, user-agent và proxy password đều browser-readable; một XSS có thể lấy toàn bộ.
2. **Chỉ có client route guard:** không middleware/server auth/RBAC. Backend bắt buộc phải kiểm tra ownership cho mọi `userId`, `groupId`, `tag_id`, job ID; không thể xác minh nên nguy cơ IDOR/permission bypass chưa được loại trừ.
3. **Automation endpoints nhận raw Zalo session và nhiều map endpoint không có app token trong request.** CORS/network controls và authorization backend chưa xác định.
4. **Giá trị mua gói do client gửi:** `buyPackageAPI` nhận `amount: pkg.price`; backend phải whitelist package/amount, nếu không có thể bị sửa request.
5. **Git object store bị nhiễm AppleDouble:** `git status/diff` báo `non-monotonic index` tại `.git/objects/pack/._pack-....idx`. Việc review/commit có thể không đáng tin cậy cho tới khi người dùng sửa repository metadata.

### Medium

1. CSP cho phép `'unsafe-inline'` và `'unsafe-eval'`, chỉ định `script-src`/`object-src` nhưng thiếu policy toàn diện (`default-src`, `connect-src`, `img-src`, `frame-src`, ...).
2. Logout cleanup không đồng nhất và không xóa cache động `ztool_friends_*`, `ztool_groups_*`; dữ liệu Zalo có thể còn trên máy dùng chung.
3. Logic API/response/error/pagination phân mảnh; cùng endpoint có payload/documentation khác nhau.
4. Business logic, cache, network và UI nằm trong component 500–1,081 dòng; duplicate nhiều modal/time/cache/group-sync code, tăng nguy cơ sửa lệch.
5. Hook dependency warnings có thể dùng proxy/friend/group state cũ; nhiều `JSON.parse(localStorage)` không guard có thể làm page crash khi cache hỏng.
6. N+1 network ở trang add-member job: mỗi group ID gọi riêng `get-group-info/[groupId]`.
7. UI trừ điểm lạc quan dựa trên snapshot `user.point`; thao tác đồng thời có thể làm hiển thị lệch backend.
8. Upload chỉ validate client-side bằng MIME khai báo và kích thước; server-side MIME/signature, malware scan, storage policy chưa xác định.
9. `dangerouslySetInnerHTML` xuất hiện trong success modal. Dữ liệu hiện được xây từ count/nội dung nội bộ, nhưng pattern này dễ thành XSS nếu sau này đưa message backend/user vào.
10. `react-hot-toast` thiếu renderer; notification referral có thể không hiển thị.
11. Fallback avatar sai path và `AccountSwitcher` gán `srcset` thay vì `src`.
12. Map page có First Load JS khoảng 398 kB, chủ yếu do ExcelJS và logic lớn.
13. Hai Next config song song và version package lệch làm maintenance khó; build hiện xác nhận `next.config.js` có hiệu lực.
14. AppleDouble `._*` bị lint như source và sinh artifact `._*.html` trong `.next/server/app`.

### Low

1. Naming folder route camelCase/kebab-case không nhất quán.
2. `next lint` đã deprecated; build script tắt lint.
3. Dependency bắc cầu có cảnh báo deprecated (`inflight`, `glob@7`, `rimraf@2`, `fstream`, `lodash.isequal`).
4. `npm ls --depth=0` báo một số optional WASM package extraneous sau install.
5. Không có `.env.example`, tài liệu local setup hay contract API chính thức trong repo.
6. Dùng `<img>` ở nhiều nơi thay vì Next Image và thiếu alt ở một số ảnh.

### Security areas chưa thể kết luận

- SQL injection/query efficiency/N+1 database, password hashing, JWT signature, token expiry, CSRF backend, CORS, file storage, secret storage, email security, webhook/cron/queue safety: **Chưa xác định từ source code hiện tại.**
- Classic CSRF giảm phần nào vì token nằm trong request body/localStorage thay vì cookie tự gửi, nhưng đây không thay thế backend authorization.

## 17. Build / Lint / Test Status

Môi trường: Node `v22.21.1`, npm `10.9.4`.

- `npm ci --no-audit`: **PASS**, 516 package; cần network permission vì sandbox ban đầu không resolve registry. Không thay đổi `package.json`/`package-lock.json`.
- `npm run lint`: **FAIL**.
  - AppleDouble `src/**/._*.tsx` gây `Parsing error: Invalid character`.
  - Lỗi thật gồm explicit `any`, unused import/state/component, no-unused-expressions, unescaped entities, hook dependency warnings, `<img>`/alt warnings, prefer-const.
  - `next lint` cảnh báo deprecated.
- Script `typecheck`: **không tồn tại**, nên không chạy riêng. `next build` đã chạy bước “Checking validity of types” thành công.
- Script `test`/`e2e`: **không tồn tại**.
- `npm run build`: **PASS** với Next `15.5.12`; compile, type validation và generate 30 route thành công. Build chủ động dùng `--no-lint`.
- Git working-state inspection: **degraded** do corrupted/invalid AppleDouble pack index. Trước khi phân tích đã có `.gitignore` modified để thêm `._*`; thay đổi đó không phải do báo cáo này tạo ra.

## 18. Development Guidelines

1. Luôn đọc file này và trace endpoint/payload thật trước khi sửa; không suy luận schema backend.
2. Tuân thủ quy tắc dự án: người dùng tự thực hiện mọi thay đổi backend/database/schema/migration. Codex chỉ phân tích và đưa patch/hướng dẫn BE khi được yêu cầu.
3. Không đổi architecture/library/refactor diện rộng trong cùng PR với feature nhỏ.
4. Giữ API response compatibility hiện tại (`code`, `mess/message/messages`) hoặc xác minh backend trước khi chuẩn hóa.
5. Mọi thao tác điểm phải xem backend là nguồn sự thật; không chỉ cập nhật React state. Cần thiết kế server-side atomic authorization + debit trước khi mở rộng map/export/billing.
6. Mọi request có `userId`, group/tag/job ID phải được backend kiểm tra ownership; frontend guard không đủ.
7. Không log hoặc đưa token, cookie Zalo, proxy credential, OTP hay `.env.local` vào output/test fixture.
8. Khi thêm upload, phải yêu cầu backend validate MIME/signature/size/count và quyền; client validation chỉ phục vụ UX.
9. Khi chạm friend/group cache, giữ semantics cache-first + silent-limit protection và scope theo Zalo userId; đồng thời cân nhắc cleanup khi logout.
10. Khi tạo message job, giữ contract `multipart/form-data`, `list_request` JSON string, `files[]`, `timeSend` format hiện tại trừ khi backend được người dùng thay đổi.
11. Khi thêm route dashboard, đặt dưới layout hiện tại và xác minh auth/session/selected-account/loading/empty/error states.
12. Trước khi handoff: chạy build; lint chỉ đáng tin sau khi loại AppleDouble khỏi lint scope và xử lý lỗi hiện hữu. Không dựa vào build để bỏ qua lint vì script đang `--no-lint`.
13. Không tự sửa `.git` hoặc xóa AppleDouble metadata trong giai đoạn này; người dùng cần quyết định cách khôi phục Git.
14. Ưu tiên reuse `MessageComposer`, contexts và `removeVietnameseTones`; tránh tạo thêm bản copy của time/cache/group-sync logic nếu feature cho phép thay đổi có kiểm soát.
15. Với thay đổi liên quan pricing, đồng bộ landing, billing và backend package catalog; không tin giá client gửi lên.

## 19. Project Mental Model

Nếu một developer mới tiếp quản ZTOOL thì cần hiểu 10 điều quan trọng nhất:

1. Đây là frontend Next.js App Router cho automation Zalo; backend và database nằm ngoài repo.
2. Browser gọi trực tiếp hai backend: API nghiệp vụ và automation Zalo/map.
3. Dashboard gần như hoàn toàn client-side; auth guard không phải security boundary.
4. Member token, API token, Zalo session và proxy đều đang ở `localStorage`.
5. Một user ZTOOL có thể quản lý nhiều Zalo account; mọi friend/group/tag/job phải scope theo Zalo `profile.userId`.
6. Hành động tốn điểm và chạy qua job queue; frontend chỉ tạo/theo dõi job, worker không nằm ở đây.
7. Friend/group dùng cache-first và có “silent-limit shield”; đừng vô tình xóa cache khi Zalo trả rỗng bất thường.
8. Logic hiện nằm trực tiếp trong page lớn, API contract không thống nhất và có nhiều duplicate; sửa nhỏ phải trace toàn bộ call site.
9. Map export/search hiện có lỗ hổng thu điểm; đây là ưu tiên nghiệp vụ/bảo mật cao nhất trước khi mở rộng module.
10. Build hiện pass nhưng lint fail nặng, Git bị AppleDouble pack index làm hỏng và repo không có tests; mọi thay đổi tiếp theo cần kiểm chứng thận trọng.
