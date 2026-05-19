import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, Clock, Star, Phone, MapPin, Instagram, ChevronRight, Scissors } from "lucide-react";

const categoryLabels: Record<string, string> = {
  manicure: "Manicure",
  pedicure: "Pedicure",
  alongamento: "Alongamento",
  manutencao: "Manutenção",
  outro: "Outros",
};

const categoryColors: Record<string, string> = {
  manicure: "bg-rose-50 text-rose-700 border-rose-200",
  pedicure: "bg-amber-50 text-amber-700 border-amber-200",
  alongamento: "bg-pink-50 text-pink-700 border-pink-200",
  manutencao: "bg-stone-50 text-stone-700 border-stone-200",
  outro: "bg-neutral-50 text-neutral-700 border-neutral-200",
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: services = [] } = trpc.services.list.useQuery({ activeOnly: true });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            <span className="font-serif text-xl font-semibold tracking-wide text-foreground">
              Nail Studio
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#servicos" className="hover:text-foreground transition-colors">Serviços</a>
            <a href="#sobre" className="hover:text-foreground transition-colors">Sobre</a>
            <a href="#contato" className="hover:text-foreground transition-colors">Contato</a>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/meus-agendamentos">
                  <Button variant="ghost" size="sm" className="text-sm">
                    Meus Agendamentos
                  </Button>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="text-sm">
                      Painel Admin
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm">
                  Entrar
                </Button>
              </Link>
            )}
            <Link href="/agendar">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                Agendar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.97 0.015 30) 0%, oklch(0.95 0.025 50) 50%, oklch(0.96 0.02 15) 100%)",
          }}
        />
        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.70 0.12 15)" }} />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "oklch(0.78 0.10 60)" }} />

        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center py-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-widest uppercase">
              <Sparkles className="w-3 h-3" />
              Beleza com Requinte
            </div>
            <h1 className="font-serif text-5xl lg:text-7xl font-light leading-tight text-foreground">
              Arte nas
              <br />
              <em className="not-italic text-primary">suas mãos</em>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md font-light">
              Experiência premium em manicure, pedicure e alongamento de unhas.
              Agende seu horário com nossas especialistas e transforme suas unhas.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/agendar">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md px-8 rounded-full">
                  Agendar Agora
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <a href="#servicos">
                <Button size="lg" variant="outline" className="rounded-full px-8 border-primary/30 text-primary hover:bg-primary/5">
                  Ver Serviços
                </Button>
              </a>
            </div>
            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">4.9</span>
                <span>avaliação</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">500+</span>
                <span>clientes satisfeitas</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: "linear-gradient(145deg, oklch(0.92 0.04 20), oklch(0.88 0.06 30))" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center"
                    style={{ background: "oklch(0.50 0.13 15)" }}>
                    <Scissors className="w-10 h-10 text-white" />
                  </div>
                  <p className="font-serif text-2xl text-white/90 font-light">Nail Studio</p>
                  <p className="text-white/60 text-sm">Beleza & Sofisticação</p>
                </div>
              </div>
              {/* Floating cards */}
              <div className="absolute top-6 -left-6 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Agendamento</p>
                  <p className="text-xs text-muted-foreground">Confirmado!</p>
                </div>
              </div>
              <div className="absolute bottom-8 -right-6 bg-white rounded-xl shadow-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs font-medium text-foreground">Adorei o resultado!</p>
                <p className="text-xs text-muted-foreground">— Maria S.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="servicos" className="py-24 bg-white">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">
              O que oferecemos
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl font-light text-foreground">
              Nossos Serviços
            </h2>
            <div className="w-16 h-0.5 bg-primary mx-auto mt-4" />
          </motion.div>

          {services.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {["Manicure", "Pedicure", "Alongamento", "Manutenção"].map((name, i) => (
                <motion.div
                  key={name}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="group p-6 rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-white"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-medium text-foreground mb-2">{name}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Serviço especializado com produtos de alta qualidade.
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, i) => (
                <motion.div
                  key={service.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="group p-6 rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-white"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Scissors className="w-5 h-5 text-primary" />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${categoryColors[service.category] ?? categoryColors.outro}`}>
                      {categoryLabels[service.category] ?? service.category}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-medium text-foreground mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{service.durationMinutes} min</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      R$ {Number(service.price).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mt-12"
          >
            <Link href="/agendar">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 shadow-md">
                Agendar um Serviço
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="sobre" className="py-24"
        style={{ background: "linear-gradient(135deg, oklch(0.97 0.015 30), oklch(0.95 0.025 50))" }}>
        <div className="container grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="space-y-6"
          >
            <p className="text-primary text-sm font-medium tracking-widest uppercase">
              Sobre nós
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl font-light text-foreground leading-tight">
              Excelência em cada
              <em className="not-italic text-primary"> detalhe</em>
            </h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              No Nail Studio, acreditamos que cuidar das unhas é uma forma de expressão pessoal.
              Nossa equipe de especialistas utiliza técnicas avançadas e produtos premium para
              garantir resultados impecáveis e duradouros.
            </p>
            <div className="grid grid-cols-3 gap-6 pt-4">
              {[
                { value: "5+", label: "Anos de experiência" },
                { value: "500+", label: "Clientes atendidas" },
                { value: "4.9★", label: "Avaliação média" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-serif text-3xl font-medium text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { icon: "💅", title: "Produtos Premium", desc: "Apenas marcas de alta qualidade" },
              { icon: "🕐", title: "Pontualidade", desc: "Respeitamos seu tempo" },
              { icon: "✨", title: "Higiene Total", desc: "Materiais esterilizados" },
              { icon: "🎨", title: "Arte Exclusiva", desc: "Designs personalizados" },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-5 shadow-sm border border-border/50">
                <span className="text-2xl">{item.icon}</span>
                <h4 className="font-serif text-base font-medium text-foreground mt-2">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-white">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">
              Depoimentos
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl font-light text-foreground">
              O que dizem nossas clientes
            </h2>
            <div className="w-16 h-0.5 bg-primary mx-auto mt-4" />
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Ana Paula", text: "Melhor salão que já fui! As profissionais são incríveis e o resultado sempre supera minhas expectativas.", rating: 5 },
              { name: "Carla M.", text: "Adoro o atendimento personalizado. Cada visita é uma experiência única. Recomendo para todas!", rating: 5 },
              { name: "Fernanda R.", text: "O alongamento ficou perfeito! Já faz 3 semanas e ainda está impecável. Voltarei com certeza.", rating: 5 },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="p-6 rounded-2xl border border-border bg-white shadow-sm"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed italic mb-4">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-xs font-semibold">{t.name[0]}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center space-y-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="font-serif text-4xl lg:text-5xl font-light">
              Pronta para se cuidar?
            </h2>
            <p className="text-primary-foreground/80 mt-4 text-lg font-light max-w-md mx-auto">
              Agende seu horário agora e experimente o melhor em cuidados com as unhas.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link href="/agendar">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-10 shadow-md font-medium">
                  Agendar Agora
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Contact / Footer ── */}
      <footer id="contato" className="bg-foreground text-background py-16">
        <div className="container grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="w-5 h-5 text-primary" />
              <span className="font-serif text-xl font-semibold">Nail Studio</span>
            </div>
            <p className="text-background/60 text-sm leading-relaxed font-light">
              Arte e sofisticação para suas unhas. Agende online com facilidade.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-lg font-medium mb-4">Contato</h4>
            <div className="space-y-3 text-sm text-background/70">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>(11) 99999-9999</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Rua das Flores, 123 — São Paulo, SP</span>
              </div>
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-primary" />
                <span>@nailstudio</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-serif text-lg font-medium mb-4">Horários</h4>
            <div className="space-y-2 text-sm text-background/70">
              <div className="flex justify-between">
                <span>Segunda a Sexta</span>
                <span>09h — 19h</span>
              </div>
              <div className="flex justify-between">
                <span>Sábado</span>
                <span>09h — 17h</span>
              </div>
              <div className="flex justify-between">
                <span>Domingo</span>
                <span>Fechado</span>
              </div>
            </div>
          </div>
        </div>
        <div className="container mt-10 pt-6 border-t border-background/10 text-center text-xs text-background/40">
          © {new Date().getFullYear()} Nail Studio. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
