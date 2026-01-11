import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { createAccessRequest } from "@/lib/supabase";

interface LeadFormProps {
  variant?: "hero" | "cta";
}

const LeadForm = ({ variant = "hero" }: LeadFormProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }

    setIsLoading(true);
    
    try {
      await createAccessRequest({ name, email });
      toast.success("Спасибо! Мы свяжемся с вами в ближайшее время.");
      setEmail("");
      setName("");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Произошла ошибка. Попробуйте еще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "hero") {
    const scrollToCTA = () => {
      const ctaElement = document.getElementById('cta');
      if (ctaElement) {
        ctaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    return (
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Button 
          onClick={scrollToCTA}
          variant="hero" 
          size="lg"
          className="min-w-[180px]"
        >
          Попробовать
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-md mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Input
        type="text"
        placeholder="Ваше имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-14 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary text-center"
      />
      <Input
        type="email"
        placeholder="Ваш email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-14 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary text-center"
      />
      <Button 
        type="submit" 
        variant="hero" 
        size="lg"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Получить доступ
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>
      <p className="text-muted-foreground text-sm text-center">
        Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
      </p>
    </motion.form>
  );
};

export default LeadForm;
