import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

const TEAM = [
  { name: "Helena", role: "Présidente, Fondatrice & Propriétaire du sanctuaire" },
  { name: "Lee", role: "Trésorier, Fondateur, Gestion informatique & comptabilité" },
  { name: "Marie", role: "Secrétaire & Fondatrice" },
  { name: "Mose", role: "Équipe équidés, caprins, chiens & chats" },
  { name: "Patricia", role: "Entretien sanctuaire, équipe équidés, caprins & chiens" },
  { name: "Moune", role: "Entretien sanctuaire, équipe chats" },
  { name: "Sylvie", role: "Entretien sanctuaire & équipe chiens" },
  { name: "Dominique", role: "Entretien sanctuaire & équipe chats" },
  { name: "Caroline", role: "Entretien sanctuaire, équipe chats & gestion des déchets" },
  { name: "Françoise & Alain", role: "Chatons | Travaux & jardinage" },
  { name: "Antonella", role: "Équipe chiens & prévisites adoptions" },
  { name: "Claudine", role: "Entretien sanctuaire" },
  { name: "Marilyne", role: "Équipe chiens" },
  { name: "Stella", role: "Équipe chiens" },
  { name: "Murielle", role: "Équipe caprins & chats" },
  { name: "Isabelle", role: "Équipe chiens" },
  { name: "Jocelyne", role: "Équipe chiens & chats" },
  { name: "Josiane", role: "Équipe chiens" },
  { name: "Nathalie", role: "Équipe chiens et chats" },
  { name: "Karine", role: "Gestion magasins animaliers & journées caddies" },
  { name: "Isabelle", role: "Photographe" },
];

export default async function TeamPage() {
  const t = await getTranslations("team");

  return (
    <Container className="py-16">
      <h1 className="text-[clamp(32px,4.5vw,52px)] leading-[1.05] mb-10">{t("title")}</h1>
      <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {TEAM.map((member, i) => (
          <Card key={`${member.name}-${i}`} className="p-5 flex flex-col gap-2">
            <div className="aspect-2/3 rounded-xl bg-[repeating-linear-gradient(135deg,#dedcdd_0_12px,#d5d3d4_12px_24px)]" />
            <h3 className="text-lg">{member.name}</h3>
            <p className="text-[13.5px] font-bold text-accent leading-snug">{member.role}</p>
          </Card>
        ))}
      </div>
    </Container>
  );
}
