-- ==========================================
-- SCHEMA SQL COMPLETO PARA O MISSÃO OAB
-- Banco de Dados: PostgreSQL (Supabase)
-- ==========================================

-- Habilitar a extensão UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE DISCIPLINAS
CREATE TABLE disciplinas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inserir disciplinas padrão
INSERT INTO disciplinas (nome) VALUES 
('Ética Profissional'),
('Direito Constitucional'),
('Direito Administrativo'),
('Direito Penal'),
('Direito Civil'),
('Direito do Trabalho')
ON CONFLICT (nome) DO NOTHING;

-- 2. TABELA DE USUÁRIOS
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    nivel INT DEFAULT 1 NOT NULL,
    xp INT DEFAULT 0 NOT NULL,
    xp_necessario INT DEFAULT 500 NOT NULL,
    moedas INT DEFAULT 50 NOT NULL,
    streak INT DEFAULT 0 NOT NULL,
    ultimo_estudo TIMESTAMP WITH TIME ZONE,
    is_premium BOOLEAN DEFAULT FALSE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABELA DE QUESTÕES
CREATE TABLE questoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materia_id INT REFERENCES disciplinas(id) ON DELETE RESTRICT NOT NULL,
    tema VARCHAR(150) NOT NULL,
    nivel VARCHAR(20) CHECK (nivel IN ('Fácil', 'Médio', 'Difícil')) NOT NULL,
    enunciado TEXT NOT NULL,
    alternativas TEXT[] NOT NULL, -- Array de textos representando A, B, C, D, E
    gabarito INT CHECK (gabarito >= 0 AND gabarito <= 4) NOT NULL, -- Índice da alternativa (0 a 4)
    explicacao TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. HISTÓRICO DE RESPOSTAS (Questões respondidas pelos alunos)
CREATE TABLE respostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
    questao_id UUID REFERENCES questoes(id) ON DELETE CASCADE NOT NULL,
    resposta_index INT NOT NULL,
    correta BOOLEAN NOT NULL,
    respondido_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABELA DE MISSÕES SISTEMA (Disponíveis globalmente)
CREATE TABLE missoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    xp_recompensa INT NOT NULL,
    moedas_recompensa INT NOT NULL,
    meta INT NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('total_questoes', 'questoes_materia', 'acertos_seguidos', 'revisao_questoes', 'completar_boss')) NOT NULL,
    materia_id INT REFERENCES disciplinas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. CONTROLE DE PROGRESSO DE MISSÕES DO USUÁRIO
CREATE TABLE usuario_missoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
    missao_id UUID REFERENCES missoes(id) ON DELETE CASCADE NOT NULL,
    progresso_atual INT DEFAULT 0 NOT NULL,
    concluida BOOLEAN DEFAULT FALSE NOT NULL,
    data_dia DATE DEFAULT CURRENT_DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_usuario_missao_dia UNIQUE (usuario_id, missao_id, data_dia)
);

-- 7. TABELA DE CONQUISTAS (Badges configurados no sistema)
CREATE TABLE conquistas (
    id VARCHAR(100) PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    xp_recompensa INT NOT NULL,
    moedas_recompensa INT NOT NULL,
    icone VARCHAR(50) NOT NULL,
    tipo_requisito VARCHAR(50) CHECK (tipo_requisito IN ('responder_questoes', 'questoes_corretas', 'streak_dias', 'materia_mestre')) NOT NULL,
    valor_requisito INT NOT NULL,
    materia_id INT REFERENCES disciplinas(id) ON DELETE SET NULL
);

-- 8. REGISTRO DE CONQUISTAS DESBLOQUEADAS PELO ALUNO
CREATE TABLE usuario_conquistas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
    conquista_id VARCHAR(100) REFERENCES conquistas(id) ON DELETE CASCADE NOT NULL,
    desbloqueada_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_usuario_conquista UNIQUE (usuario_id, conquista_id)
);

-- 9. MODO REVISÃO (Lógica de repetição espaçada - SuperMemo SM-2 simplificado)
CREATE TABLE revisoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
    questao_id UUID REFERENCES questoes(id) ON DELETE CASCADE NOT NULL,
    data_proxima_revisao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    intervalo_dias INT DEFAULT 1 NOT NULL,
    fator_facilidade NUMERIC(3,2) DEFAULT 2.50 NOT NULL,
    repeticoes INT DEFAULT 0 NOT NULL,
    status VARCHAR(30) DEFAULT 'Revisar hoje' CHECK (status IN ('Revisar hoje', 'Revisar depois', 'Domado')) NOT NULL,
    criada_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_usuario_questao_revisao UNIQUE (usuario_id, questao_id)
);

-- 10. RANKING SEMANAL DE XP
CREATE TABLE ranking_semanal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
    xp_semanal INT DEFAULT 0 NOT NULL,
    questoes_respondidas INT DEFAULT 0 NOT NULL,
    taxa_acerto NUMERIC(3,2) DEFAULT 0.00 NOT NULL,
    data_inicio_semana DATE DEFAULT DATE_TRUNC('week', CURRENT_DATE)::DATE NOT NULL,
    CONSTRAINT unique_usuario_ranking_semana UNIQUE (usuario_id, data_inicio_semana)
);


-- ==========================================
-- TRIGGERS E FUNÇÕES AUXILIARES NO POSTGRESQL
-- ==========================================

-- Função para atualizar o nível quando o XP do usuário muda
CREATE OR REPLACE FUNCTION trigger_atualizar_nivel_usuario()
RETURNS TRIGGER AS $$
DECLARE
    novo_nivel INT;
    xp_necessario_nivel INT;
BEGIN
    novo_nivel := NEW.nivel;
    xp_necessario_nivel := NEW.xp_necessario;
    
    -- Subir de nível recursivamente caso o XP ganho passe do limite
    WHILE NEW.xp >= xp_necessario_nivel LOOP
        NEW.xp := NEW.xp - xp_necessario_nivel;
        novo_nivel := novo_nivel + 1;
        xp_necessario_nivel := novo_nivel * 500;
    END LOOP;
    
    NEW.nivel := novo_nivel;
    NEW.xp_necessario := xp_necessario_nivel;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER atualizar_nivel_usuario
BEFORE UPDATE OF xp ON usuarios
FOR EACH ROW
EXECUTE FUNCTION trigger_atualizar_nivel_usuario();


-- Função para gerenciar o streak do usuário ao responder uma questão
CREATE OR REPLACE FUNCTION trigger_atualizar_streak_estudo()
RETURNS TRIGGER AS $$
DECLARE
    usuario_record RECORD;
    ontem DATE;
    hoje DATE;
    ultimo_estudo_date DATE;
BEGIN
    SELECT ultimo_estudo, streak INTO usuario_record FROM usuarios WHERE id = NEW.usuario_id;
    
    hoje := CURRENT_DATE;
    ontem := hoje - INTERVAL '1 day';
    
    IF usuario_record.ultimo_estudo IS NULL THEN
        -- Primeiro estudo do aluno
        UPDATE usuarios 
        SET streak = 1, ultimo_estudo = NOW()
        WHERE id = NEW.usuario_id;
    ELSE
        ultimo_estudo_date := usuario_record.ultimo_estudo::DATE;
        
        IF ultimo_estudo_date = ontem THEN
            -- Estudou ontem, aumenta o streak e atualiza data
            UPDATE usuarios 
            SET streak = streak + 1, ultimo_estudo = NOW()
            WHERE id = NEW.usuario_id;
        ELSIF ultimo_estudo_date < ontem THEN
            -- Perdeu a sequência (mais de 1 dia sem estudar)
            UPDATE usuarios 
            SET streak = 1, ultimo_estudo = NOW()
            WHERE id = NEW.usuario_id;
        ELSIF ultimo_estudo_date = hoje THEN
            -- Apenas atualiza a data/hora exata sem alterar o número do streak
            UPDATE usuarios 
            SET ultimo_estudo = NOW()
            WHERE id = NEW.usuario_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER atualizar_streak_estudo
AFTER INSERT ON respostas
FOR EACH ROW
EXECUTE FUNCTION trigger_atualizar_streak_estudo();


-- ==========================================
-- SEGURANÇA E REGRAS DE RLS (ROW LEVEL SECURITY)
-- ==========================================

-- Habilitar RLS nas tabelas sensíveis ao usuário
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_missoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisoes ENABLE ROW LEVEL SECURITY;

-- Criar Políticas de Acesso
-- 1. Políticas para Usuarios
CREATE POLICY "Usuários podem ver seu próprio perfil" ON usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem editar seu próprio perfil" ON usuarios
    FOR UPDATE USING (auth.uid() = id);

-- 2. Políticas para Respostas
CREATE POLICY "Usuários podem ver suas próprias respostas" ON respostas
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem salvar suas próprias respostas" ON respostas
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- 3. Políticas para Revisões
CREATE POLICY "Usuários podem gerenciar sua lista de revisão" ON revisoes
    FOR ALL USING (auth.uid() = usuario_id);
