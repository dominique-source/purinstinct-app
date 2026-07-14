export const RAW_50 = [
  ["Eloi Tremblay","M"],["Gabriel Cote","M"],["Samuel Gagnon","M"],
  ["Alexandre Bouchard","M"],["Jacob Fortin","M"],["Thomas Belanger","M"],
  ["Felix Lavoie","M"],["Maxime Girard","M"],["Julien Morin","M"],
  ["Nicolas Pelletier","M"],["Antoine Gagne","M"],["Mathieu Roy","M"],
  ["Charles Leblanc","M"],["Etienne Bergeron","M"],["Loic Thibault","M"],
  ["Kevin Ouellet","M"],["Dylan Dionne","M"],["Raphael Gauthier","M"],
  ["Adam Marchand","M"],["Zachary Hebert","M"],
  ["Emilie Rousseau","F"],["Camille Simard","F"],["Laurie Beaulieu","F"],
  ["Megane Perron","F"],["Jade Lapointe","F"],["Chloe Boucher","F"],
  ["Audrey Giguere","F"],["Sarah-Maude Cote","F"],["Marianne Guay","F"],
  ["Florence Levesque","F"],["Kim Dufour","F"],["Amelie Desrosiers","F"],
  ["Valerie Grondin","F"],["Noemie Charron","F"],["Alexia Paquette","F"],
  ["William Picard","M"],["Jeremy Lebeau","M"],["Mathis Arsenault","M"],
  ["Hugo Lafleur","M"],["Theo Cormier","M"],["Loick Fillion","M"],
  ["Simon Michaud","M"],["Edouard Vaillancourt","M"],["Patrick Boivin","M"],
  ["Benoit Caron","M"],["Isabelle Hamel","F"],["Stephanie Rancourt","F"],
  ["Catherine Demers","F"],["Jessica Beaumont","F"],["Annick Fortier","F"]
];

export const INITIAL_ROSTERS = [
  { id:"r1", name:"Étudiants en médecine Ulaval", entries: RAW_50.slice(0,22).map(([name,gender]) => ({name,gender})) },
];
