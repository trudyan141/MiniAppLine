// Debug file for server
import { IncomingMessage, ServerResponse } from 'http';
import { db } from './db';

export function logRequest(req: IncomingMessage, res: ServerResponse) {
  const { method, url, headers } = req;
  console.log(`[${new Date().toISOString()}] ${method} ${url}`);
  console.log('Headers:', JSON.stringify(headers, null, 2));
  
  // Log request body for POST/PUT requests
  if (method === 'POST' || method === 'PUT') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        console.log('Body:', JSON.stringify(JSON.parse(body), null, 2));
      } catch (e) {
        console.log('Body:', body);
      }
    });
  }
  
  // Log response status
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: BufferEncoding, callback?: () => void) {
    console.log(`[${new Date().toISOString()}] Response: ${res.statusCode}`);
    return originalEnd.call(this, chunk, encoding, callback);
  };
}

// Simple function to check SQLite date handling
export async function testSQLiteDateHandling() {
  try {
    console.log("Testing SQLite date handling...");
    
    // Get SQLite client
    const sqlite = (db as any).$client;
    
    // Create a test table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS date_test (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_date TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert a row
    const insertStmt = sqlite.prepare(`
      INSERT INTO date_test DEFAULT VALUES
    `);
    const result = insertStmt.run();
    
    // Query the row
    const selectStmt = sqlite.prepare(`
      SELECT * FROM date_test WHERE id = ?
    `);
    const row = selectStmt.get(result.lastInsertRowid);
    
    console.log("SQLite date test result:", row);
    console.log("SQLite date type:", typeof row.test_date);
    
    return row;
  } catch (error) {
    console.error("SQLite date test error:", error);
    return null;
  }
} 