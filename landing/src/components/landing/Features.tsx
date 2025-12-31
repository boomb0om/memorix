import { motion } from "framer-motion";
import { 
  Sparkles, 
  GraduationCap, 
  Bot, 
  BarChart3, 
  Video,
  Edit3
} from "lucide-react";

const features = [
  {
    icon: Edit3,
    title: "Удобный редактор курсов",
    description: "Создавайте курсы вручную или доверьте AI. Загрузите конспекты и материалы — AI сгенерирует полноценный курс с уроками, тестами и структурой. Полный контроль над каждым элементом."
  },
  {
    icon: Sparkles,
    title: "AI-генерация курсов",
    description: "Загрузите свои конспекты и материалы — AI создаст полноценный курс за минуты. Структура, уроки, тесты и интерактивные элементы генерируются автоматически на основе вашего контента."
  },
  {
    icon: Video,
    title: "Проведение вебинаров",
    description: "Встроенная платформа для живых вебинаров. Привлекайте студентов, проводите интерактивные сессии и записывайте их для повторного просмотра. Всё в одном месте."
  },
  {
    icon: GraduationCap,
    title: "LMS-платформа",
    description: "Готовая платформа для прохождения курсов: красивый интерфейс, прогресс студентов, сертификаты. Ваши студенты получают лучший опыт обучения."
  },
  {
    icon: Bot,
    title: "AI-кураторы",
    description: "Умные помощники отвечают на вопросы студентов, проверяют задания и поддерживают мотивацию 24/7. Вы экономите время, студенты получают мгновенную поддержку."
  },
  {
    icon: BarChart3,
    title: "Аналитика и управление",
    description: "Отслеживайте прогресс студентов, конверсии и доходы. Управляйте всем из единой панели. Данные, которые помогают расти вашему бизнесу."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px]" />

      <div className="container relative z-10 px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-2 rounded-full bg-secondary text-primary text-sm font-medium mb-4">
            Возможности платформы
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Всё для создания и{" "}
            <span className="gradient-text">ведения курсов</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            От идеи до прибыльного бизнеса за дни, а не месяцы. Мощный редактор курсов, AI-генерация из ваших материалов, 
            вебинары и автоматизация — всё, что нужно для масштабируемого образовательного бизнеса.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative p-6 rounded-2xl card-gradient border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
