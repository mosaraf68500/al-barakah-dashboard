export interface SubcategoryDefinition {
  id: string;
  name: string;
  category: string;
  icon?: string;
}

export const CATEGORY_SUBCATEGORIES: Record<string, SubcategoryDefinition[]> = {
  'Medicine & Health': [
    {
      id: 'medicines-wellness',
      name: 'Medicines & Wellness',
      category: 'Medicine & Health',
    },
    {
      id: 'surgical-first-aid',
      name: 'Surgical & First Aid',
      category: 'Medicine & Health',
    },
    {
      id: 'womens-care',
      name: "Women's Care & Napkins",
      category: 'Medicine & Health',
    },
    {
      id: 'baby-care-diaper',
      name: 'Baby Care & Diapers',
      category: 'Medicine & Health',
    },
    {
      id: 'protection',
      name: 'Protection',
      category: 'Medicine & Health',
    },
  ],
};

export const getSubcategoriesForCategory = (categoryName: string): SubcategoryDefinition[] => {
  if (!categoryName) return [];
  const match = Object.keys(CATEGORY_SUBCATEGORIES).find(
    (key) => key.toLowerCase() === categoryName.trim().toLowerCase()
  );
  return match ? CATEGORY_SUBCATEGORIES[match] : [];
};
