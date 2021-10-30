CREATE TABLE IF NOT EXISTS projects (
    id            CHAR(36)        PRIMARY KEY,
    project_name  VARCHAR(64)     UNIQUE NOT NULL,
    display_name  VARCHAR(64),
    description   TEXT            NOT NULL,
    longdesc      TEXT            NOT NULL
);

CREATE TABLE IF NOT EXISTS project_links (
    project       CHAR(36)      NOT NULL,
    display_name  VARCHAR(36)   NOT NULL,
    url           TEXT          NOT NULL,

    CONSTRAINT fk_link_project FOREIGN KEY (project)
    REFERENCES projects(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS updates (
    id            CHAR(36)    PRIMARY KEY,
    version       VARCHAR(64) NOT NULL,
    project       CHAR(36)    NOT NULL,
    description   TEXT        NOT NULL,

    CONSTRAINT fk_update_project FOREIGN KEY (project)
    REFERENCES projects(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS stored_files (
    id            CHAR(36)    PRIMARY KEY,
    update_id     CHAR(36),
    original_name VARCHAR(128),

    CONSTRAINT fk_file_update FOREIGN KEY (update_id)
    REFERENCES updates(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);