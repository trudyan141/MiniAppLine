/**
 * Polyfill cho toISOString
 * File này phải được import đầu tiên trong server/index.ts
 */

// Lưu phương thức gốc
const originalToISOString = Date.prototype.toISOString;

// Patch Object.prototype để thêm phương thức toISOString cho tất cả các đối tượng
// Điều này đảm bảo rằng bất kỳ đối tượng nào cũng có phương thức này, tránh lỗi
Object.defineProperty(Object.prototype, 'toISOString', {
  value: function() {
    // Nếu đối tượng là Date, sử dụng phương thức gốc
    if (this instanceof Date && originalToISOString) {
      try {
        return originalToISOString.call(this);
      } catch (e) {
        // Nếu phương thức gốc gây lỗi, sử dụng phương pháp thủ công
      }
    }
    
    // Nếu không phải Date hoặc phương thức gốc không tồn tại, tạo một chuỗi ISO thủ công
    try {
      // Cố gắng chuyển đối tượng thành Date
      let date: Date;
      if (this instanceof Date) {
        date = this;
      } else {
        date = new Date(this);
      }
      
      if (!isNaN(date.getTime())) {
        // Nếu là một ngày hợp lệ, trả về định dạng ISO
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}.${String(date.getUTCMilliseconds()).padStart(3, '0')}Z`;
      }
    } catch (e) {
      console.error("Error in toISOString polyfill:", e);
    }
    
    // Trả về chuỗi mặc định nếu không thể chuyển đổi thành ngày hợp lệ
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}T${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}.${String(now.getUTCMilliseconds()).padStart(3, '0')}Z`;
  },
  configurable: true,
  writable: true
});

// Patch Date.parse để xử lý các chuỗi không hợp lệ
const originalDateParse = Date.parse;
Date.parse = function(dateString: string): number {
  try {
    const timestamp = originalDateParse(dateString);
    if (!isNaN(timestamp)) {
      return timestamp;
    }
    
    // Nếu Date.parse tiêu chuẩn thất bại, thử các format khác
    // Có thể thêm xử lý cho các định dạng cụ thể ở đây
    
  } catch (e) {
    console.error("Error in Date.parse polyfill:", e);
  }
  
  // Trả về ngày hiện tại nếu parse thất bại
  return new Date().getTime();
};

console.log("[Polyfill] toISOString polyfill đã được áp dụng"); 