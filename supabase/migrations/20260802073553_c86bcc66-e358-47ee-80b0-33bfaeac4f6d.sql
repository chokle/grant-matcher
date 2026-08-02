CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL DEFAULT '',
  website text,
  province text,
  sector text,
  stage text,
  employees integer,
  annual_revenue numeric,
  incorporation_date date,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.funding_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  agency text NOT NULL,
  funder_type text NOT NULL DEFAULT 'government',
  level text NOT NULL DEFAULT 'federal',
  province text NOT NULL DEFAULT 'All',
  funding_type text NOT NULL DEFAULT 'grant',
  sectors text[] NOT NULL DEFAULT '{}',
  min_amount numeric NOT NULL DEFAULT 0,
  max_amount numeric NOT NULL DEFAULT 0,
  deadline date,
  description text NOT NULL DEFAULT '',
  eligibility text NOT NULL DEFAULT '',
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.funding_programs TO anon;
GRANT SELECT ON public.funding_programs TO authenticated;
GRANT ALL ON public.funding_programs TO service_role;
ALTER TABLE public.funding_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Funding programs are public" ON public.funding_programs FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.pipeline_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.funding_programs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'saved',
  notes text,
  match_score integer,
  match_reason text,
  generated_letter text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_items TO authenticated;
GRANT ALL ON public.pipeline_items TO service_role;
ALTER TABLE public.pipeline_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pipeline" ON public.pipeline_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pipeline_item_id uuid NOT NULL REFERENCES public.pipeline_items(id) ON DELETE CASCADE,
  hours numeric NOT NULL DEFAULT 0,
  note text,
  logged_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;
GRANT ALL ON public.time_entries TO service_role;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own time entries" ON public.time_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER pipeline_items_updated_at BEFORE UPDATE ON public.pipeline_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.funding_programs (name, agency, funder_type, level, province, funding_type, sectors, min_amount, max_amount, deadline, description, eligibility, url) VALUES
('Canada Digital Adoption Program (CDAP)','Innovation, Science and Economic Development Canada','government','federal','All','grant','{Technology,Retail,Commercialization}',5000,15000,'2026-12-31','Grant to develop a digital adoption plan, plus access to a 0% interest BDC loan up to $100K.','Canadian-owned for-profit business with at least 1 employee and $500K+ annual revenue.','https://ised-isde.canada.ca'),
('NRC IRAP Innovation Assistance','National Research Council of Canada','government','federal','All','grant','{R&D,Technology,Engineering,Innovation}',50000,1000000,'2026-11-30','Non-repayable contributions for technology innovation projects, plus advisory services.','Incorporated, profit-oriented SME in Canada with 500 or fewer full-time employees.','https://nrc.canada.ca'),
('SR&ED Investment Tax Credit','Canada Revenue Agency','government','federal','All','tax_credit','{R&D,Science,Engineering,Technology}',20000,3000000,'2026-12-31','Refundable tax credit of up to 35% on qualified scientific research and experimental development expenditures.','Canadian-controlled private corporations performing eligible R&D work in Canada.','https://canada.ca/sred'),
('CanExport SMEs','Global Affairs Canada','government','federal','All','grant','{Manufacturing,Technology,Agriculture,Commercialization}',10000,50000,'2026-09-30','Covers up to 50% of costs to develop new export markets.','Canadian SME with 1–500 employees and $100K–$100M in annual revenue.','https://tradecommissioner.gc.ca'),
('Futurpreneur Startup Program','Futurpreneur Canada','private','federal','All','loan','{Startup,Entrepreneurship,Retail}',20000,60000,'2026-12-31','Startup financing plus two years of expert mentorship for young entrepreneurs.','Canadian residents aged 18–39 launching or running a business under 12 months old.','https://futurpreneur.ca'),
('Women Entrepreneurship Fund','Women Entrepreneurship Strategy','government','federal','All','grant','{Entrepreneurship,Startup,Retail}',25000,100000,'2026-10-15','Support for women-owned and women-led businesses to grow and reach new markets.','Majority women-owned Canadian business.','https://ised-isde.canada.ca'),
('Strategic Innovation Fund','Innovation, Science and Economic Development Canada','government','federal','All','grant','{R&D,Manufacturing,Innovation,Commercialization}',10000000,100000000,'2026-12-31','Large-scale repayable and non-repayable contributions for transformative industrial projects.','Incorporated Canadian entities proposing projects over $20M in total costs.','https://ised-isde.canada.ca'),
('Industrial Research Assistance Youth Employment','National Research Council of Canada','government','federal','All','grant','{Technology,R&D,Startup}',10000,30000,'2026-08-31','Wage subsidy to hire post-secondary graduates for innovation roles.','Canadian SMEs hiring graduates aged 15–30.','https://nrc.canada.ca'),
('Canada Small Business Financing Program','Innovation, Science and Economic Development Canada','government','federal','All','loan','{Retail,Manufacturing,Hospitality}',50000,1000000,'2026-12-31','Government-backed term loans for equipment, property and leasehold improvements.','For-profit small businesses with under $10M in gross annual revenue.','https://ised-isde.canada.ca'),
('Clean Growth Program','Natural Resources Canada','government','federal','All','grant','{CleanTech,Energy,Engineering}',100000,5000000,'2026-11-01','Funding for clean technology research, development and demonstration projects.','Canadian companies in energy, mining and forestry sectors.','https://nrcan.gc.ca'),
('Sustainable Development Technology Canada','SDTC','government','federal','All','grant','{CleanTech,Innovation,Engineering}',100000,10000000,'2026-10-31','Funding for pre-commercial clean technology demonstration projects.','Canadian companies developing clean technologies with strong environmental benefits.','https://sdtc.ca'),
('Mitacs Accelerate','Mitacs','private','federal','All','grant','{R&D,Science,Technology,Innovation}',7500,60000,'2026-12-31','Research internships pairing your business with graduate students; Mitacs matches your contribution.','Canadian business partnering with a Canadian university researcher.','https://mitacs.ca'),
('Business Scale-up and Productivity (Ontario)','FedDev Ontario','government','federal','Ontario','loan','{Manufacturing,Technology,Commercialization}',500000,10000000,'2026-12-31','Interest-free repayable contributions for high-growth firms scaling operations.','Incorporated for-profit business operating in southern Ontario.','https://feddev-ontario.canada.ca'),
('Ontario Together Trade Fund','Government of Ontario','government','provincial','Ontario','grant','{Manufacturing,Supply Chain}',50000,5000000,'2026-09-15','Support for Ontario manufacturers to diversify markets and strengthen supply chains.','Ontario-based manufacturers with at least three years of operations.','https://ontario.ca'),
('Ontario Innovation Tax Credit','Government of Ontario','government','provincial','Ontario','tax_credit','{R&D,Technology,Science}',10000,300000,'2026-12-31','8% refundable tax credit on eligible R&D expenditures in Ontario.','Corporations with a permanent establishment in Ontario performing R&D.','https://ontario.ca'),
('Ontario Automotive Modernization Program','Government of Ontario','government','provincial','Ontario','grant','{Manufacturing,Automotive}',10000,150000,'2026-08-29','Cost-shared funding for small and medium automotive parts suppliers to modernize.','Ontario automotive suppliers with 5–500 employees.','https://ontario.ca'),
('Digital Main Street','Government of Ontario','government','provincial','Ontario','grant','{Retail,Technology,Hospitality}',2500,2500,'2026-09-30','Digital transformation grant for main street small businesses.','Ontario brick-and-mortar businesses with 1–50 employees.','https://digitalmainstreet.ca'),
('Investissement Québec Innovation','Investissement Québec','government','provincial','Quebec','loan','{R&D,Manufacturing,Innovation}',50000,5000000,'2026-12-31','Financing for innovation and productivity projects in Québec.','Businesses operating in Québec with a viable innovation project.','https://invest-quebec.com'),
('Programme Innovation (Québec)','Ministère de l''Économie du Québec','government','provincial','Quebec','grant','{Innovation,R&D,Commercialization}',50000,350000,'2026-10-31','Support for innovation projects from feasibility through commercialization.','Québec-based for-profit enterprises and co-operatives.','https://quebec.ca'),
('Québec R&D Tax Credit','Revenu Québec','government','provincial','Quebec','tax_credit','{R&D,Science,Engineering}',15000,1000000,'2026-12-31','Refundable tax credit on salaries paid for R&D performed in Québec.','Corporations with an establishment in Québec conducting R&D.','https://revenuquebec.ca'),
('Alberta Innovates Micro Voucher','Alberta Innovates','government','provincial','Alberta','grant','{Technology,R&D,Startup}',10000,10000,'2026-09-30','Voucher to access technical services and expertise for early product development.','Alberta-based technology SMEs with fewer than 500 employees.','https://albertainnovates.ca'),
('Alberta Innovates Product Demonstration','Alberta Innovates','government','provincial','Alberta','grant','{Technology,Commercialization,Innovation}',50000,300000,'2026-11-15','Funding to demonstrate near-commercial products with a pilot customer.','Alberta SMEs with a technology at TRL 6 or above.','https://albertainnovates.ca'),
('Alberta Scale-up and Growth Accelerator','Alberta Innovates','private','provincial','Alberta','grant','{Startup,Technology,Entrepreneurship}',25000,100000,'2026-10-01','Accelerator program with funding and coaching for high-growth Alberta companies.','Alberta technology companies with early revenue traction.','https://albertainnovates.ca'),
('Innovate BC Ignite','Innovate BC','government','provincial','British Columbia','grant','{R&D,Technology,Engineering,Innovation}',100000,300000,'2026-09-15','Funding for industry-academic partnerships solving technology challenges.','BC-based companies partnering with a research institution.','https://innovatebc.ca'),
('BC Launch Online','Government of British Columbia','government','provincial','British Columbia','grant','{Retail,Technology}',5000,7500,'2026-08-31','Grant to build or improve an online store for BC small businesses.','BC businesses with fewer than 149 employees.','https://launchonline.ca'),
('BC Scientific Research Tax Credit','Government of British Columbia','government','provincial','British Columbia','tax_credit','{R&D,Science}',10000,500000,'2026-12-31','10% refundable credit on eligible SR&ED expenditures made in BC.','Corporations with a permanent establishment in BC.','https://gov.bc.ca'),
('Manitoba Innovation Growth Program','Government of Manitoba','government','provincial','Manitoba','grant','{Innovation,Technology,Commercialization}',25000,100000,'2026-10-15','Cost-shared support to commercialize new products and processes.','Manitoba-based SMEs with fewer than 200 employees.','https://gov.mb.ca'),
('Saskatchewan Technology Start-up Incentive','Government of Saskatchewan','government','provincial','Saskatchewan','tax_credit','{Startup,Technology,Innovation}',20000,140000,'2026-12-31','45% non-refundable tax credit for investors in eligible Saskatchewan startups.','Saskatchewan technology startups with fewer than 50 employees.','https://saskatchewan.ca'),
('Saskatchewan Innovation and Science Fund','Innovation Saskatchewan','government','provincial','Saskatchewan','grant','{Science,R&D,Agriculture}',50000,500000,'2026-11-30','Support for research infrastructure and science-based innovation.','Saskatchewan organizations conducting applied research.','https://innovationsask.ca'),
('Nova Scotia Innovation Rebate','Invest Nova Scotia','government','provincial','Nova Scotia','grant','{Manufacturing,Technology,Innovation}',100000,3750000,'2026-12-31','Rebate of up to 25% on large productivity and innovation investments.','Nova Scotia companies investing at least $500K in an innovation project.','https://investnovascotia.ca'),
('Nova Scotia Small Business Development Program','Invest Nova Scotia','government','provincial','Nova Scotia','grant','{Startup,Retail,Entrepreneurship}',5000,15000,'2026-09-30','Consulting support to help small businesses build growth capacity.','Nova Scotia businesses with fewer than 20 employees.','https://investnovascotia.ca'),
('New Brunswick Innovation Voucher','New Brunswick Innovation Foundation','government','provincial','New Brunswick','grant','{R&D,Technology,Innovation}',20000,80000,'2026-10-31','Vouchers to fund applied research with a New Brunswick institution.','New Brunswick SMEs with a defined research need.','https://nbif.ca'),
('Newfoundland Business Investment Fund','Government of Newfoundland and Labrador','government','provincial','Newfoundland and Labrador','loan','{Manufacturing,Technology,Ocean Tech}',50000,500000,'2026-12-31','Term loans and equity for growth-oriented businesses in strategic sectors.','Businesses operating in Newfoundland and Labrador.','https://gov.nl.ca'),
('PEI Innovation and Development Grant','Innovation PEI','government','provincial','Prince Edward Island','grant','{Innovation,Manufacturing,Agriculture}',10000,200000,'2026-11-15','Support for product development, market expansion and productivity.','Businesses located and operating in Prince Edward Island.','https://innovationpei.com'),
('Yukon Innovation Fund','Government of Yukon','government','provincial','Yukon','grant','{Innovation,Technology,Startup}',5000,50000,'2026-09-30','Funding for Yukon entrepreneurs developing innovative products.','Yukon-based businesses and entrepreneurs.','https://yukon.ca'),
('NWT Support for Entrepreneurs and Economic Development','Government of Northwest Territories','government','provincial','Northwest Territories','grant','{Entrepreneurship,Retail,Startup}',5000,75000,'2026-10-31','Contributions for business start-up, expansion and marketing in the NWT.','NWT residents and businesses.','https://gov.nt.ca'),
('Nunavut Small Business Support Program','Government of Nunavut','government','provincial','Nunavut','grant','{Entrepreneurship,Retail}',5000,50000,'2026-12-31','Grants for Nunavut entrepreneurs to start and grow businesses.','Nunavut residents operating a business in the territory.','https://gov.nu.ca'),
('Toronto Business Improvement Grant','City of Toronto','government','municipal','Ontario','grant','{Retail,Hospitality}',2500,20000,'2026-08-15','Matching funds for storefront improvements and accessibility upgrades.','Businesses located in a Toronto Business Improvement Area.','https://toronto.ca'),
('Vancouver Green Business Grant','City of Vancouver','government','municipal','British Columbia','grant','{CleanTech,Retail,Hospitality}',2000,15000,'2026-09-30','Funding for energy efficiency and waste reduction upgrades.','Businesses with a City of Vancouver business licence.','https://vancouver.ca'),
('RBC Small Business Grant','RBC Royal Bank','private','federal','All','grant','{Startup,Retail,Entrepreneurship}',10000,100000,'2026-10-01','Annual grant competition supporting Canadian small business growth.','Canadian small businesses operating for at least one year.','https://rbc.com'),
('Telus Community Innovation Fund','TELUS','private','federal','All','grant','{Technology,Health,Innovation}',10000,250000,'2026-11-30','Funding for technology projects with measurable social or health impact.','Canadian organizations and social enterprises.','https://telus.com'),
('Shopify Build Native Fund','Shopify','private','federal','All','grant','{Technology,Retail,Commercialization}',25000,100000,'2026-12-15','Support for developers and merchants building commerce technology.','Canadian technology companies building on commerce platforms.','https://shopify.ca');