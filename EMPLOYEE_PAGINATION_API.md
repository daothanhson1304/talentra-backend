# Employee Pagination API Documentation

## Endpoint

```
GET /api/employees/paginated
```

## Query Parameters

| Parameter    | Type   | Default     | Description                                                               |
| ------------ | ------ | ----------- | ------------------------------------------------------------------------- |
| `page`       | Number | 1           | Trang hiện tại (bắt đầu từ 1)                                             |
| `limit`      | Number | 10          | Số lượng employee trên mỗi trang (tối đa 100)                             |
| `search`     | String | ''          | Tìm kiếm theo name, email, phone, department, position                    |
| `sortBy`     | String | 'createdAt' | Sắp xếp theo field (name, email, salary, department, position, createdAt) |
| `sortOrder`  | String | 'desc'      | Thứ tự sắp xếp ('asc' hoặc 'desc')                                        |
| `department` | String | ''          | Lọc theo department                                                       |
| `position`   | String | ''          | Lọc theo position                                                         |

## Response Format

```json
{
  "employees": [
    {
      "_id": "employee_id",
      "name": "Employee Name",
      "email": "employee@example.com",
      "phone": "1234567890",
      "salary": 50000,
      "department": "IT",
      "position": "Developer",
      "role": "employee",
      "avatar": ""
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 50,
    "limit": 10,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  },
  "filters": {
    "search": "john",
    "department": "IT",
    "position": "Developer",
    "sortBy": "name",
    "sortOrder": "asc"
  }
}
```

## Examples

### 1. Lấy trang đầu tiên với 10 employee

```
GET /api/employees/paginated?page=1&limit=10
```

### 2. Tìm kiếm employee có tên chứa "john"

```
GET /api/employees/paginated?search=john
```

### 3. Lọc theo department và sắp xếp theo salary

```
GET /api/employees/paginated?department=IT&sortBy=salary&sortOrder=desc
```

### 4. Kết hợp nhiều filter

```
GET /api/employees/paginated?page=2&limit=20&search=developer&department=IT&position=Senior&sortBy=name&sortOrder=asc
```

## Error Responses

### Invalid pagination parameters

```json
{
  "error": "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100"
}
```

### Server error

```json
{
  "error": "Internal server error message"
}
```

## Features

- **Pagination**: Hỗ trợ phân trang với page và limit
- **Search**: Tìm kiếm theo nhiều field (name, email, phone, department, position)
- **Filtering**: Lọc theo department và position
- **Sorting**: Sắp xếp theo bất kỳ field nào
- **Case-insensitive**: Tìm kiếm và lọc không phân biệt hoa thường
- **Validation**: Kiểm tra tính hợp lệ của tham số
- **Performance**: Sử dụng Promise.all để query song song
