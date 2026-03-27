import { motion } from "framer-motion";
import { Clock3, Utensils } from "lucide-react";


const MEAL_DATA: Record<string, any> = {
  winter: { // Focus : Fer & Magnésium
    breakfast: { title: "Pancakes à la Banane", desc: "Riche en potassium pour limiter les crampes.", img: "https://images.unsplash.com/photo-1506084868730-3c2b1febb008?q=80&w=600", color: "bg-blue-50" },
    lunch: { title: "Salade de Lentilles & Œuf", desc: "Le combo Fer + Protéines pour compenser les pertes.", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600", color: "bg-blue-50" },
    snack: { title: "Chocolat Noir & Amandes", desc: "Le Magnésium pur pour détendre tes muscles.", img: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?q=80&w=600", color: "bg-blue-50" },
    dinner: { title: "Bouillon de Poulet & Gingembre", desc: "Anti-inflammatoire et ultra digeste.", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=600", color: "bg-blue-50" }
  },
  spring: { // Focus : Phytoestrogènes & Énergie
    breakfast: { title: "Toast Avocat & Graines", desc: "Bons lipides pour soutenir la montée d'œstrogènes.", img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=600", color: "bg-green-50" },
    lunch: { title: "Bowl au Quinoa & Brocoli", desc: "Crucifères pour aider le foie à gérer les hormones.", img: "https://images.unsplash.com/photo-1543332164-6e82f355badc?q=80&w=600", color: "bg-green-50" },
    snack: { title: "Yaourt au Kéfir & Myrtilles", desc: "Probiotiques pour ton estrobolome.", img: "https://images.unsplash.com/photo-1577805947697-89e18249d767?q=80&w=600", color: "bg-green-50" },
    dinner: { title: "Saumon Grillé & Asperges", desc: "Oméga-3 pour la qualité folliculaire.", img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=600", color: "bg-green-50" }
  },
  summer: { // Focus : Antioxydants & Légèreté
    breakfast: { title: "Açaï Bowl aux Baies", desc: "Antioxydants massifs pour protéger l'ovulation.", img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=600", color: "bg-orange-50" },
    lunch: { title: "Poke Bowl Thon & Mangue", desc: "Énergie légère pour ton pic de forme.", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600", color: "bg-orange-50" },
    snack: { title: "Pastèque & Menthe", desc: "Hydratation maximale pour ta glaire cervicale.", img: "https://images.unsplash.com/photo-1528498033973-3c070444c31a?q=80&w=600", color: "bg-orange-50" },
    dinner: { title: "Gambas Sautées & Courgettes", desc: "Zinc et iode pour le soutien thyroïdien.", img: "https://images.unsplash.com/photo-1559742811-822873691df8?q=80&w=600", color: "bg-orange-50" }
  },
  autumn: { // Focus : Glucides complexes & Progestérone
    breakfast: { title: "Porridge Avoine & Noix", desc: "Stabilise ta sérotonine pour éviter l'irritabilité.", img: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=600", color: "bg-amber-50" },
    lunch: { title: "Curry de Patate Douce", desc: "Glucides complexes pour nourrir ta phase lutéale.", img: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=600", color: "bg-amber-50" },
    snack: { title: "Pomme & Beurre d'Amande", desc: "Fibres et graisses saines contre les fringales.", img: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?q=80&w=600", color: "bg-amber-50" },
    dinner: { title: "Gratin de Courge & Poulet", desc: "Réconfort et tryptophane pour un bon sommeil.", img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600", color: "bg-amber-50" }
  },

  menopause: {
    breakfast: { 
      title: "Bowl Calcium & Figue", 
      desc: "Soutenir ta densité osseuse avec du yaourt grec et des fruits secs.", 
      img: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?q=80&w=600", 
      color: "bg-purple-50" 
    },
    lunch: { 
      title: "Sardines Grillées & Citron", 
      desc: "Des Oméga-3 essentiels pour protéger ton système cardiovasculaire.", 
      img: "https://images.unsplash.com/photo-1534604973900-c41ab4c5e636?q=80&w=600", 
      color: "bg-purple-50" 
    },
    snack: { 
      title: "Poignée de Noix & Lin", 
      desc: "Phytoestrogènes naturels pour aider à réguler les bouffées de chaleur.", 
      img: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=600", 
      color: "bg-purple-50" 
    },
    dinner: { 
      title: "Tofu sauté & Brocoli", 
      desc: "Isoflavones et fibres pour un équilibre hormonal nocturne léger.", 
      img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600", 
color: "bg-purple-50" 
    }
  }, // ✅ Correction 1 : On ferme la section 'menopause' ici avant de commencer 'pill'

  pill: { // Focus : Vitamines B & Soutien Hépatique
    breakfast: { 
      title: "Œufs Brouillés & Épinards", 
      desc: "Riche en B12 et Folates pour compenser les pertes liées à la pilule.", 
      img: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=600", 
      color: "bg-blue-50" 
    },
    lunch: { 
      title: "Bowl Détox au Radis Noir", 
      desc: "Aide ton foie à métaboliser efficacement les hormones de synthèse.", 
      img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600", 
      color: "bg-blue-50" 
    },
    snack: { 
      title: "Amandes & Fruit Frais", 
      desc: "Magnésium pour compenser la perte urinaire accrue sous contraception.", 
      img: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?q=80&w=600", 
      color: "bg-blue-50" 
    },
    dinner: { 
      title: "Poulet Vapeur & Asperges", 
      desc: "Un repas léger pour ne pas surcharger ton système hépatique la nuit.", 
      img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=600", 
      color: "bg-blue-50" 
    }
  } // ✅ On ferme la section 'pill'
}; // ✅ Correction 2 : On ferme l'objet MEAL_DATA entier ici

export function VisualPhasePlate({ state }: { state: any }) { 
  const hour = new Date().getHours();
  let mealType: "breakfast" | "lunch" | "snack" | "dinner" = "lunch";
  
  if (hour < 10) mealType = "breakfast";
  else if (hour >= 10 && hour < 14) mealType = "lunch";
  else if (hour >= 14 && hour < 18) mealType = "snack";
  else mealType = "dinner";

  // ✅ LOGIQUE DE SÉLECTION DU PROFIL (Ménopause, Pilule ou Cycle)
  let profileKey = state.phase; 
  if (state.mode === "menopause") profileKey = "menopause";
  else if (state.birthControl === "pill") profileKey = "pill";

  const meal = MEAL_DATA[profileKey]?.[mealType] || MEAL_DATA.winter.lunch;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }}
      className={`${meal.color} rounded-[2.5rem] p-5 border border-white/50 shadow-sm overflow-hidden`}
    >
      <div className="flex flex-col md:flex-row gap-5 items-center">
        <div className="w-full md:w-32 h-32 rounded-[2rem] overflow-hidden shadow-md flex-shrink-0">
          <img src={meal.img} alt={meal.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock3 className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Inspiration {mealType === 'snack' ? 'Goûter' : mealType}
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">{meal.title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">"{meal.desc}"</p>
        </div>
      </div>
    </motion.div>
  );
}
