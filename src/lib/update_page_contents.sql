
-- Insert additional data for the index page, filling in anything that might be missing
INSERT INTO public.page_contents (page, section, key, content, content_type)
VALUES
-- Hero section
('index', 'hero', 'title_line1', 'ACENDA', 'text'),
('index', 'hero', 'title_line2', 'A IMAGINAÇÃO', 'text'),
('index', 'hero', 'title_line3', 'DO SEU FILHO!', 'text'),
('index', 'hero', 'subtitle', 'Crie histórias divertidas e personalizadas que dão vida às aventuras do seu filho e despertem sua paixão pela leitura. Leva apenas alguns segundos!', 'text'),
('index', 'hero', 'button_text', 'CRIAR HISTÓRIA', 'text'),
('index', 'hero', 'button_subtitle', 'Experimente Grátis!', 'text'),
('index', 'hero', 'image_url', '/lovable-uploads/c957b202-faa2-45c1-9fb5-e93af40aa4dd.png', 'image'),
('index', 'hero', 'image_alt', 'Livro mágico com paisagens fantásticas e cenário de aventura', 'text'),
('index', 'hero', 'banner_text', 'Junte-se a mais de 100.000 famílias usando o Story Spark para cultivar a paixão pela leitura.', 'text'),

-- Features section
('index', 'features', 'section_title', 'Por que escolher o Story Spark?', 'text'),
('index', 'features', 'section_description', 'Criamos histórias mágicas que incentivam a leitura e fortalecem o vínculo familiar.', 'text'),
('index', 'features', 'feature1_title', 'Histórias Personalizadas', 'text'),
('index', 'features', 'feature1_description', 'Crie histórias únicas com o nome e características do seu filho como protagonista.', 'text'),
('index', 'features', 'feature2_title', 'Ilustrações Mágicas', 'text'),
('index', 'features', 'feature2_description', 'Imagens coloridas e encantadoras que trazem a história à vida.', 'text'),
('index', 'features', 'feature3_title', 'Personagens Diversos', 'text'),
('index', 'features', 'feature3_description', 'Escolha entre vários personagens e cenários para criar histórias diversas.', 'text'),
('index', 'features', 'feature4_title', 'Valores e Lições', 'text'),
('index', 'features', 'feature4_description', 'Histórias que transmitem valores importantes e lições de vida.', 'text'),

-- How it Works section
('index', 'how_it_works', 'section_title', 'COMECE A CRIAR', 'text'),
('index', 'how_it_works', 'step1_title', 'CRIE SUA HISTÓRIA COM IMAGINAÇÃO!', 'text'),
('index', 'how_it_works', 'step1_description', 'Basta escrever o que você quer que aconteça na história!', 'text'),
('index', 'how_it_works', 'step1_image', '/lovable-uploads/72f6e9b6-e312-4a1c-8402-c8c60c94959b.png', 'image'),
('index', 'how_it_works', 'step2_title', 'DÊ VIDA À HISTÓRIA!', 'text'),
('index', 'how_it_works', 'step2_description', 'Escolha um nome, faça o upload de uma foto e comece a criar!', 'text'),
('index', 'how_it_works', 'step2_image', '/lovable-uploads/72f6e9b6-e312-4a1c-8402-c8c60c94959b.png', 'image'),
('index', 'how_it_works', 'step3_title', 'PERSONALIZE PARA AS NECESSIDADES DE APRENDIZAGEM', 'text'),
('index', 'how_it_works', 'step3_description', 'Adapte cada história às necessidades únicas da criança.', 'text'),
('index', 'how_it_works', 'step3_image', '/lovable-uploads/72f6e9b6-e312-4a1c-8402-c8c60c94959b.png', 'image'),
('index', 'how_it_works', 'cta_title', 'Explore uma aventura mágica em cada conto!', 'text'),
('index', 'how_it_works', 'cta_description', 'Leia e compartilhe sua história para dar vida a ela.', 'text'),
('index', 'how_it_works', 'cta_button_text', 'CRIAR HISTÓRIA', 'text'),

-- Testimonials section
('index', 'testimonials', 'section_title', 'O que as famílias estão dizendo', 'text'),
('index', 'testimonials', 'section_description', 'Histórias que estão fazendo a diferença na vida de milhares de crianças.', 'text'),
('index', 'testimonials', 'testimonial1_avatar', 'https://randomuser.me/api/portraits/women/32.jpg', 'image'),
('index', 'testimonials', 'testimonial1_name', 'Ana Silva', 'text'),
('index', 'testimonials', 'testimonial1_text', 'Minha filha adora as histórias personalizadas! Agora ela pede para ler todos os dias.', 'text'),
('index', 'testimonials', 'testimonial2_avatar', 'https://randomuser.me/api/portraits/men/46.jpg', 'image'),
('index', 'testimonials', 'testimonial2_name', 'Carlos Mendes', 'text'),
('index', 'testimonials', 'testimonial2_text', 'Uma forma incrível de incentivar a leitura. Meu filho se empolga ao ver seu nome nas aventuras.', 'text'),
('index', 'testimonials', 'testimonial3_avatar', 'https://randomuser.me/api/portraits/women/65.jpg', 'image'),
('index', 'testimonials', 'testimonial3_name', 'Juliana Martins', 'text'),
('index', 'testimonials', 'testimonial3_text', 'As ilustrações são lindas e as histórias têm valores importantes. Recomendo para todas as famílias!', 'text'),

-- CTA section
('index', 'cta', 'title', 'Pronto para criar memórias inesquecíveis?', 'text'),
('index', 'cta', 'description', 'Comece agora a criar histórias personalizadas que seu filho vai adorar!', 'text'),
('index', 'cta', 'button_text', 'Criar Minha Primeira História', 'text'),
('index', 'cta', 'subtitle', 'Experimente gratuitamente hoje!', 'text')
ON CONFLICT (page, section, key) DO NOTHING;
