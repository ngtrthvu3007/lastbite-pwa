# Jira ticket template

Mọi ticket mới (và ticket được viết lại) phải theo file này. Người đọc chính là
dev mới: đọc xong phải biết **làm gì, làm ở đâu, xong khi nào**, không cần hỏi lại.

## 1. Cấu trúc

```
Epic      Nhóm lớn theo module (ví dụ E01 - Xác thực và tài khoản)
└─ Story  Một kết quả người dùng hoặc hệ thống nhìn thấy được
   └─ Subtask  Một đầu việc cụ thể, một người làm trong một lần
```

- Story mô tả **mục tiêu và phạm vi**. Subtask mô tả **việc phải làm**.
- Mỗi subtask nên làm xong trong một PR. Nếu một subtask cần hai PR, tách nó ra.
- Tách subtask theo **việc**, không theo layer chung chung. Mỗi subtask phải có
  kết quả kiểm tra được.

## 2. Tiêu đề

Tiêu đề phải cho người đọc hình dung được ticket làm gì, mà không cần mở ticket.

| Loại | Format | Ví dụ |
|---|---|---|
| Story | Kết quả cụ thể, không dùng danh từ chung | `/auth/me` trả thêm `hasStore` để FE biết user đã có store chưa |
| Subtask | `[BE]` / `[FE]` / `[Test]` + động từ + đối tượng | `[BE] Thêm field hasStore (tạm false) vào response GET /auth/me` |

Không dùng:
- Tiêu đề chỉ có số thứ tự ("Subtask 2").
- Tiêu đề trừu tượng ("Khóa session", "Hoàn thiện auth").
- Tiêu đề nói về lý do mà không nói về việc.

Đặt tên code, endpoint, field trong dấu backtick.

## 3. Template Story

Heading dùng tiếng Anh, nội dung viết tiếng Việt.

```markdown
## Goal
1 đến 3 câu: người dùng hoặc hệ thống được gì sau khi xong.

## Design decisions
Các quyết định đã chốt, mỗi gạch đầu dòng một quyết định.
Ghi cả điều KHÔNG làm nếu dễ bị hiểu nhầm.

## Tasks
| Subtask | Ai | Nội dung |
|---|---|---|
| LB-xx | BE | ... |

Thứ tự làm: ...

## Out of scope
Việc dễ bị tưởng là thuộc ticket này nhưng không làm, kèm ticket nào sẽ làm.

## Acceptance criteria
* Điều kiện kiểm tra được, viết dạng "Khi ... thì ...".

## Dependencies
* LB-xx: lý do phụ thuộc.

## References
* Link Notion, Figma, docs liên quan.
```

## 4. Template Subtask

```markdown
## Goal
1 câu: sau khi xong thì có gì mới.

## Tasks
* Việc 1, ghi rõ file hoặc thư mục sẽ sửa.
* Việc 2 ...

## Notes
* Ràng buộc: quy ước đặt tên, thứ không được đổi, thứ không được thêm.

## Acceptance criteria
* Điều kiện kiểm tra được.
```

Subtask test dùng 2 phần thay cho Tasks:

```markdown
## A. Unit tests
* Case cần test và kết quả mong đợi.

## B. Manual test
* Từng bước chạy tay, kết quả mong đợi ở mỗi bước.
```

## 5. Quy tắc viết

1. **Mỗi việc ghi rõ ở đâu.** Có đường dẫn file hoặc thư mục. Người mới không phải
   đoán nên mở file nào.
2. **AC phải kiểm tra được.** Mỗi AC trả lời được "pass hay fail". Không dùng
   "hoạt động tốt", "xử lý đúng".
3. **Luôn có Out of scope** khi ticket nằm gần ticket khác. Ghi rõ việc đó thuộc
   ticket nào.
4. **Không để mâu thuẫn.** Nếu quyết định thiết kế đổi, sửa mô tả ticket. Không để
   mô tả cũ và comment mới nói ngược nhau.
5. **Một ticket, một người làm, một mục tiêu.** Việc FE và BE khác nhau thì tách
   subtask.
6. **Nêu rõ cần duyệt ở đâu.** Nếu ticket đụng migration, contract GraphQL/gRPC,
   auth, hạ tầng hoặc UI styling, ghi vào Notes: "cần duyệt trước khi làm" (xem
   Approval Gates trong `AGENTS.md`).
7. **Heading tiếng Anh, nội dung tiếng Việt.** Thuật ngữ kỹ thuật giữ tiếng Anh
   (store, session, permission, ownership, cache, login...), không dịch gượng.
   Tên code, endpoint, field giữ nguyên và đặt trong backtick.
8. **Trạng thái làm việc nằm ở Jira**, không ghi vào Notion.

## 6. Checklist trước khi giao ticket

- [ ] Tiêu đề cho biết ticket làm gì.
- [ ] Goal viết được trong 1 đến 3 câu.
- [ ] Mỗi task có file hoặc thư mục.
- [ ] Có Out of scope nếu ticket nằm gần ticket khác.
- [ ] Mỗi AC kiểm tra được.
- [ ] Dependencies đúng, link hoạt động.
- [ ] Việc cần duyệt (migration, contract, auth...) đã được ghi rõ.
- [ ] Có assignee.

## 7. Ví dụ

Xem LB-17 và các subtask LB-91 (BE), LB-92 (FE), LB-93 (Test).
