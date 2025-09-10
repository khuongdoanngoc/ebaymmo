db = db.getSiblingDB('chat');

// Tạo user có quyền readWrite trên "chat"
db.createUser({
    user: "root",
    pwd: "root",
    roles: [{ role: "readWrite", db: "chat" }]
});

// Tạo một collection để MongoDB lưu database "chat"
db.createCollection("initCollection");

print("Database 'chat' và user 'root' đã được tạo!");
