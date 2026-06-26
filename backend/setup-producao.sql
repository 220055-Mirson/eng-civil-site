-- ============================================================
--  OBRAVIA — setup-producao.sql
--  Cria todas as tabelas + utilizador Admin
--  Admin: adminobravia@gmail.com / obravia220055
--
--  Uso:
--  psql "INTERNAL_DATABASE_URL_AQUI" -f setup-producao.sql
-- ============================================================

-- ── DROP na ordem inversa das FK ──────────────────────────────
DROP TABLE IF EXISTS mensagens          CASCADE;
DROP TABLE IF EXISTS pedidos_directos   CASCADE;
DROP TABLE IF EXISTS propostas          CASCADE;
DROP TABLE IF EXISTS pedidos            CASCADE;
DROP TABLE IF EXISTS projetos           CASCADE;
DROP TABLE IF EXISTS sessoes            CASCADE;
DROP TABLE IF EXISTS usuarios           CASCADE;

-- ── USUARIOS ──────────────────────────────────────────────────
CREATE TABLE usuarios (
    id                      SERIAL PRIMARY KEY,
    nome                    TEXT NOT NULL,
    email                   TEXT UNIQUE NOT NULL,
    senha                   TEXT NOT NULL,
    role                    TEXT DEFAULT 'usuario',
    status                  TEXT DEFAULT 'pendente',
    telefone                TEXT,
    tipo                    TEXT,
    numero_ordem            TEXT,
    diploma_path            TEXT,
    anos_experiencia        TEXT,
    especializacao          TEXT,
    linkedin                TEXT,
    empresa_nome            TEXT,
    nuit                    TEXT,
    responsavel             TEXT,
    bi                      TEXT,
    alvara_path             TEXT,
    nuit_comprovativo_path  TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    data_criacao            TIMESTAMPTZ DEFAULT NOW()
);

-- ── SESSOES ───────────────────────────────────────────────────
CREATE TABLE sessoes (
    id            SERIAL PRIMARY KEY,
    token         TEXT UNIQUE NOT NULL,
    usuario_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_criacao  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sessoes_token   ON sessoes(token);
CREATE INDEX idx_sessoes_usuario ON sessoes(usuario_id);

-- ── PROJETOS ──────────────────────────────────────────────────
CREATE TABLE projetos (
    id                SERIAL PRIMARY KEY,
    titulo            TEXT NOT NULL,
    descricao         TEXT NOT NULL,
    categoria         TEXT DEFAULT 'Outros',
    local             TEXT,
    tags              TEXT,
    fotos             JSONB DEFAULT '[]',
    foto_capa         TEXT,
    usuario_id        INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    engenheiro_nome   TEXT,
    data_criacao      TIMESTAMPTZ DEFAULT NOW(),
    data_atualizacao  TIMESTAMPTZ
);
CREATE INDEX idx_projetos_usuario ON projetos(usuario_id);

-- ── PEDIDOS ───────────────────────────────────────────────────
CREATE TABLE pedidos (
    id                   SERIAL PRIMARY KEY,
    codigo               TEXT UNIQUE,
    tipo                 TEXT NOT NULL,
    descricao            TEXT NOT NULL,
    local                TEXT NOT NULL,
    talhao               NUMERIC(12,2),
    orcamento_min        NUMERIC(15,2),
    orcamento_max        NUMERIC(15,2),
    urgencia             TEXT,
    nome_cliente         TEXT NOT NULL,
    telefone             TEXT,
    email_cliente        TEXT,
    contacto_preferencia TEXT,
    status               TEXT DEFAULT 'aberto',
    usuario_id           INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em            TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pedidos_status  ON pedidos(status);
CREATE INDEX idx_pedidos_tipo    ON pedidos(tipo);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_criado  ON pedidos(criado_em DESC);

-- ── PROPOSTAS ─────────────────────────────────────────────────
CREATE TABLE propostas (
    id                SERIAL PRIMARY KEY,
    pedido_id         INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    engenheiro_id     INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    engenheiro_nome   TEXT,
    valor             NUMERIC(15,2),
    prazo             TEXT,
    descricao         TEXT,
    disponibilidade   TEXT,
    status            TEXT DEFAULT 'pendente',
    enviada_em        TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (pedido_id, engenheiro_id)
);
CREATE INDEX idx_propostas_pedido  ON propostas(pedido_id);
CREATE INDEX idx_propostas_eng     ON propostas(engenheiro_id);
CREATE INDEX idx_propostas_status  ON propostas(status);

-- ── PEDIDOS DIRECTOS (contacto via projeto) ──────────────────
CREATE TABLE pedidos_directos (
    id               SERIAL PRIMARY KEY,
    engenheiro_id    INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    engenheiro_nome  TEXT,
    projeto_id       INTEGER REFERENCES projetos(id) ON DELETE SET NULL,
    cliente_id       INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    cliente_nome     TEXT NOT NULL,
    cliente_tel      TEXT,
    tipo_projeto     TEXT,
    mensagem         TEXT,
    lido             BOOLEAN DEFAULT FALSE,
    status           TEXT DEFAULT 'novo',
    criado_em        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pd_engenheiro ON pedidos_directos(engenheiro_id);
CREATE INDEX idx_pd_lido       ON pedidos_directos(lido);

-- ── MENSAGENS / CHAT ──────────────────────────────────────────
CREATE TABLE mensagens (
    id             SERIAL PRIMARY KEY,
    proposta_id    INTEGER NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
    remetente_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    remetente_nome TEXT NOT NULL,
    conteudo       TEXT NOT NULL,
    lida           BOOLEAN DEFAULT FALSE,
    enviada_em     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_mensagens_proposta  ON mensagens(proposta_id);
CREATE INDEX idx_mensagens_remetente ON mensagens(remetente_id);

-- ── VIEWS ÚTEIS ───────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_pedidos_resumo AS
SELECT
    p.*,
    COUNT(pr.id) AS total_propostas,
    COUNT(pr.id) FILTER (WHERE pr.status = 'pendente') AS propostas_pendentes,
    COUNT(pr.id) FILTER (WHERE pr.status = 'aceite')  AS propostas_aceites
FROM pedidos p
LEFT JOIN propostas pr ON pr.pedido_id = p.id
GROUP BY p.id;

CREATE OR REPLACE VIEW vw_propostas_detalhe AS
SELECT
    pr.*,
    p.tipo         AS pedido_tipo,
    p.local        AS pedido_local,
    p.nome_cliente AS pedido_cliente,
    p.codigo       AS pedido_codigo,
    p.status       AS pedido_status
FROM propostas pr
JOIN pedidos p ON p.id = pr.pedido_id;

-- ============================================================
--  UTILIZADOR ADMIN
--  Email: adminobravia@gmail.com
--  Senha: obravia220055
-- ============================================================
INSERT INTO usuarios (nome, email, senha, role, status, tipo)
VALUES (
    'Admin OBRAVIA',
    'adminobravia@gmail.com',
    '$2b$10$lD3xZxox2vOHAOisNW.xBubFY90OHrppjFPugXQPZlfzPnzfRBbPq',
    'admin',
    'aprovado',
    'admin'
);

-- Confirmar
SELECT id, nome, email, role, status FROM usuarios;
