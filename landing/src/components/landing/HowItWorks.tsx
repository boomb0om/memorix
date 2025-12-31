import { motion } from "framer-motion";
import { Upload, Wand2, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Загрузите контент",
    description: "Добавьте свои конспекты, материалы, презентации или опишите тему. AI проанализирует всё и создаст полноценный курс."
  },
  {
    number: "02",
    icon: Wand2,
    title: "Создайте или сгенерируйте",
    description: "Используйте удобный редактор для ручного создания или доверьте AI — он сгенерирует структуру, уроки, тесты и интерактивные элементы за минуты."
  },
  {
    number: "03",
    icon: Rocket,
    title: "Запускайте и зарабатывайте",
    description: "Проводите вебинары, публикуйте курс, принимайте оплату и масштабируйте бизнес. Всё готово к запуску уже сегодня."
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container relative z-10 px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-2 rounded-full bg-secondary text-primary text-sm font-medium mb-4">
            Как это работает
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            От идеи до курса за{" "}
            <span className="gradient-text">3 шага</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Никакого программирования, дизайна или съёмок. Мощный редактор курсов и AI-генерация из ваших материалов. 
            Просто поделитесь знаниями — мы сделаем остальное. Запуск за дни, а не месяцы.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-accent/20" />

            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
              >
                <div className="text-center">
                  {/* Step Circle */}
                  <div className="relative mx-auto w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 blur-xl" />
                    <div className="relative w-full h-full rounded-full bg-card border-2 border-primary/30 flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground">
                      {step.number}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
