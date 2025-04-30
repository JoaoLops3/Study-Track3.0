-- Criar enum para roles
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member');

-- Criar enum para status de convite
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'rejected');

-- Criar tabela de equipes
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT teams_name_length CHECK (char_length(name) >= 3)
);

-- Criar tabela de membros da equipe
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role team_role DEFAULT 'member' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(team_id, user_id)
);

-- Criar tabela de convites
CREATE TABLE IF NOT EXISTS public.team_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role team_role DEFAULT 'member' NOT NULL,
    status invite_status DEFAULT 'pending' NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days') NOT NULL,
    UNIQUE(team_id, email)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_team_id ON public.team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON public.team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON public.team_invites(status);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para updated_at
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_team_updated_at();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_team_updated_at();

CREATE TRIGGER update_team_invites_updated_at
    BEFORE UPDATE ON public.team_invites
    FOR EACH ROW
    EXECUTE FUNCTION public.update_team_updated_at();

-- Criar políticas de segurança
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Políticas para teams
CREATE POLICY "teams_select_policy"
    ON public.teams
    FOR SELECT
    USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = teams.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "teams_insert_policy"
    ON public.teams
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "teams_update_policy"
    ON public.teams
    FOR UPDATE
    USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = teams.id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "teams_delete_policy"
    ON public.teams
    FOR DELETE
    USING (auth.uid() = owner_id);

-- Políticas para team_members
CREATE POLICY "team_members_select_policy"
    ON public.team_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE id = team_members.team_id
            AND (owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.team_members
                WHERE team_id = team_members.team_id
                AND user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "team_members_insert_policy"
    ON public.team_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE id = team_members.team_id
            AND (owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.team_members
                WHERE team_id = team_members.team_id
                AND user_id = auth.uid()
                AND role IN ('owner', 'admin')
            ))
        )
    );

CREATE POLICY "team_members_update_policy"
    ON public.team_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE id = team_members.team_id
            AND (owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.team_members
                WHERE team_id = team_members.team_id
                AND user_id = auth.uid()
                AND role IN ('owner', 'admin')
            ))
        )
    );

CREATE POLICY "team_members_delete_policy"
    ON public.team_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE id = team_members.team_id
            AND (owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.team_members
                WHERE team_id = team_members.team_id
                AND user_id = auth.uid()
                AND role IN ('owner', 'admin')
            ))
        )
    );

-- Políticas para team_invites
CREATE POLICY "team_invites_select_policy"
    ON public.team_invites
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE id = team_invites.team_id
            AND (owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.team_members
                WHERE team_id = team_invites.team_id
                AND user_id = auth.uid()
                AND role IN ('owner', 'admin')
            ))
        )
    );

CREATE POLICY "team_invites_insert_policy"
    ON public.team_invites
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE id = team_invites.team_id
            AND (owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.team_members
                WHERE team_id = team_invites.team_id
                AND user_id = auth.uid()
                AND role IN ('owner', 'admin')
            ))
        )
    );

CREATE POLICY "team_invites_update_policy"
    ON public.team_invites
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE id = team_invites.team_id
            AND (owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.team_members
                WHERE team_id = team_invites.team_id
                AND user_id = auth.uid()
                AND role IN ('owner', 'admin')
            ))
        )
    );

CREATE POLICY "team_invites_delete_policy"
    ON public.team_invites
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE id = team_invites.team_id
            AND (owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.team_members
                WHERE team_id = team_invites.team_id
                AND user_id = auth.uid()
                AND role IN ('owner', 'admin')
            ))
        )
    ); 