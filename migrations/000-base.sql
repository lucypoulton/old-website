CREATE TABLE IF NOT EXISTS projects (
    id            CHAR(36)        PRIMARY KEY DEFAULT UUID(),
    project_name  VARCHAR(64)     NOT NULL,
    colour_one    INT             NOT NULL,
    colour_two    INT             NOT NULL,
    description   TEXT            NOT NULL
);

CREATE TABLE IF NOT EXISTS updates (
    id            CHAR(36)    PRIMARY KEY DEFAULT UUID(),
    version       VARCHAR(64) NOT NULL,
    project       CHAR(36)    NOT NULL,
    description   TEXT        NOT NULL,

    CONSTRAINT fk_project FOREIGN KEY (project)
    REFERENCES projects(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS stored_files (
    id            CHAR(36)    PRIMARY KEY DEFAULT UUID(),
    update_id     CHAR(36),
    original_name VARCHAR(128),

    CONSTRAINT fk_update FOREIGN KEY (update_id)
    REFERENCES updates(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);