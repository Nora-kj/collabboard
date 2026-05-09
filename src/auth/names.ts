const ANIMALS = [
  "Otter", "Fox", "Wolf", "Heron", "Badger", "Lynx", "Falcon",
  "Beaver", "Marmot", "Newt", "Stoat", "Jay", "Pika", "Tapir",
  "Kestrel", "Sable", "Ibex", "Quokka", "Caracal", "Numbat",
];

export const generateAnonymousName = (): string => {
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]!;
  return `Anonymous ${animal}`;
};
