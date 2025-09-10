-- Tạo schema timetable nếu chưa tồn tại
CREATE SCHEMA IF NOT EXISTS timetable;

-- Tạo bảng chain trước vì task và execution_log tham chiếu đến nó
CREATE TABLE IF NOT EXISTS timetable.chain (
    chain_id INTEGER PRIMARY KEY,
    chain_name VARCHAR(255),
    run_at TIMESTAMP,
    max_instances INTEGER,
    timeout INTEGER,
    live BOOLEAN,
    execution_log TEXT
);

-- Tạo bảng task sau chain
CREATE TABLE IF NOT EXISTS timetable.task (
    task_id INTEGER PRIMARY KEY,
    chain_id INTEGER,
    task_name VARCHAR(255),
    kind VARCHAR(50),
    command TEXT,
    run_uid VARCHAR(50),
    ignore_error BOOLEAN,
    execution_logs TEXT,
    FOREIGN KEY (chain_id) REFERENCES timetable.chain(chain_id)
);

-- Tạo bảng execution_log sau cùng
CREATE TABLE IF NOT EXISTS timetable.execution_log (
    log_id INTEGER PRIMARY KEY,
    chain_id INTEGER,
    task_id INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50),
    FOREIGN KEY (chain_id) REFERENCES timetable.chain(chain_id),
    FOREIGN KEY (task_id) REFERENCES timetable.task(task_id)
);

ALTER TABLE timetable.task DROP COLUMN IF EXISTS execution_logs;
