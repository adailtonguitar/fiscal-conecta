
-- Categorias do cardápio (lanchonete/hotel)
CREATE TABLE public.hotel_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hotel_categorias ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_hotel_categorias_empresa ON public.hotel_categorias(empresa_id);

CREATE POLICY "Members can view" ON public.hotel_categorias FOR SELECT USING (is_company_member(empresa_id));
CREATE POLICY "Members can insert" ON public.hotel_categorias FOR INSERT WITH CHECK (is_company_member(empresa_id));
CREATE POLICY "Admins can update" ON public.hotel_categorias FOR UPDATE USING (is_company_admin_or_manager(empresa_id));
CREATE POLICY "Admins can delete" ON public.hotel_categorias FOR DELETE USING (is_company_admin_or_manager(empresa_id));

-- Produtos do cardápio
CREATE TABLE public.hotel_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES public.hotel_categorias(id) ON DELETE SET NULL,
  nome text NOT NULL,
  descricao text,
  preco numeric NOT NULL DEFAULT 0,
  estoque integer NOT NULL DEFAULT 0,
  imagem_url text,
  ativo boolean NOT NULL DEFAULT true,
  horario_inicio time,
  horario_fim time,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hotel_produtos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_hotel_produtos_empresa ON public.hotel_produtos(empresa_id);
CREATE INDEX idx_hotel_produtos_categoria ON public.hotel_produtos(categoria_id);

CREATE POLICY "Members can view" ON public.hotel_produtos FOR SELECT USING (is_company_member(empresa_id));
CREATE POLICY "Members can insert" ON public.hotel_produtos FOR INSERT WITH CHECK (is_company_member(empresa_id));
CREATE POLICY "Admins can update" ON public.hotel_produtos FOR UPDATE USING (is_company_admin_or_manager(empresa_id));
CREATE POLICY "Admins can delete" ON public.hotel_produtos FOR DELETE USING (is_company_admin_or_manager(empresa_id));

-- Catálogo diário
CREATE TABLE public.catalogo_diario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT CURRENT_DATE,
  titulo text,
  modelo_escolhido text,
  status text NOT NULL DEFAULT 'rascunho',
  imagem_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.catalogo_diario ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_catalogo_diario_empresa ON public.catalogo_diario(empresa_id);
CREATE INDEX idx_catalogo_diario_data ON public.catalogo_diario(data);

CREATE POLICY "Members can view" ON public.catalogo_diario FOR SELECT USING (is_company_member(empresa_id));
CREATE POLICY "Members can insert" ON public.catalogo_diario FOR INSERT WITH CHECK (is_company_member(empresa_id));
CREATE POLICY "Admins can update" ON public.catalogo_diario FOR UPDATE USING (is_company_admin_or_manager(empresa_id));
CREATE POLICY "Admins can delete" ON public.catalogo_diario FOR DELETE USING (is_company_admin_or_manager(empresa_id));

-- Produtos do catálogo
CREATE TABLE public.catalogo_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogo_id uuid NOT NULL REFERENCES public.catalogo_diario(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.hotel_produtos(id) ON DELETE CASCADE,
  preco_personalizado numeric,
  destaque boolean NOT NULL DEFAULT false
);
ALTER TABLE public.catalogo_produtos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_catalogo_produtos_catalogo ON public.catalogo_produtos(catalogo_id);

CREATE POLICY "Members can view" ON public.catalogo_produtos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.catalogo_diario cd WHERE cd.id = catalogo_id AND is_company_member(cd.empresa_id)));
CREATE POLICY "Members can insert" ON public.catalogo_produtos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.catalogo_diario cd WHERE cd.id = catalogo_id AND is_company_member(cd.empresa_id)));
CREATE POLICY "Admins can update" ON public.catalogo_produtos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.catalogo_diario cd WHERE cd.id = catalogo_id AND is_company_admin_or_manager(cd.empresa_id)));
CREATE POLICY "Admins can delete" ON public.catalogo_produtos FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.catalogo_diario cd WHERE cd.id = catalogo_id AND is_company_admin_or_manager(cd.empresa_id)));

-- Quartos
CREATE TABLE public.quartos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  numero text NOT NULL,
  status text NOT NULL DEFAULT 'livre',
  valor_diaria numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quartos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_quartos_empresa ON public.quartos(empresa_id);

CREATE POLICY "Members can view" ON public.quartos FOR SELECT USING (is_company_member(empresa_id));
CREATE POLICY "Members can insert" ON public.quartos FOR INSERT WITH CHECK (is_company_member(empresa_id));
CREATE POLICY "Admins can update" ON public.quartos FOR UPDATE USING (is_company_admin_or_manager(empresa_id));
CREATE POLICY "Admins can delete" ON public.quartos FOR DELETE USING (is_company_admin_or_manager(empresa_id));

-- Hóspedes
CREATE TABLE public.hospedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cpf text,
  telefone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hospedes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_hospedes_empresa ON public.hospedes(empresa_id);

CREATE POLICY "Members can view" ON public.hospedes FOR SELECT USING (is_company_member(empresa_id));
CREATE POLICY "Members can insert" ON public.hospedes FOR INSERT WITH CHECK (is_company_member(empresa_id));
CREATE POLICY "Admins can update" ON public.hospedes FOR UPDATE USING (is_company_admin_or_manager(empresa_id));
CREATE POLICY "Admins can delete" ON public.hospedes FOR DELETE USING (is_company_admin_or_manager(empresa_id));

-- Consumo de quarto
CREATE TABLE public.consumo_quarto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quarto_id uuid NOT NULL REFERENCES public.quartos(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.hotel_produtos(id) ON DELETE CASCADE,
  hospede_id uuid REFERENCES public.hospedes(id) ON DELETE SET NULL,
  quantidade integer NOT NULL DEFAULT 1,
  valor numeric NOT NULL DEFAULT 0,
  data timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.consumo_quarto ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_consumo_quarto_quarto ON public.consumo_quarto(quarto_id);

CREATE POLICY "Members can view" ON public.consumo_quarto FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.quartos q WHERE q.id = quarto_id AND is_company_member(q.empresa_id)));
CREATE POLICY "Members can insert" ON public.consumo_quarto FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.quartos q WHERE q.id = quarto_id AND is_company_member(q.empresa_id)));
CREATE POLICY "Admins can update" ON public.consumo_quarto FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.quartos q WHERE q.id = quarto_id AND is_company_admin_or_manager(q.empresa_id)));
CREATE POLICY "Admins can delete" ON public.consumo_quarto FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.quartos q WHERE q.id = quarto_id AND is_company_admin_or_manager(q.empresa_id)));
