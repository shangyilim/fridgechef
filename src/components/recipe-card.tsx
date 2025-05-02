
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Apple, Beef, Carrot, Fish, Drumstick, Salad } from 'lucide-react'; // Example icons

interface Recipe {
  name: string;
  ingredients: string;
  instructions: string;
}

type RecipeCardProps = {
  recipe: Recipe;
};

// Simple function to get an icon based on keywords in the recipe name
const getRecipeIcon = (name: string): React.ReactNode => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('chicken')) return <Drumstick className="h-5 w-5 text-muted-foreground" />;
  if (lowerName.includes('beef') || lowerName.includes('steak')) return <Beef className="h-5 w-5 text-muted-foreground" />;
  if (lowerName.includes('fish') || lowerName.includes('salmon')) return <Fish className="h-5 w-5 text-muted-foreground" />;
  if (lowerName.includes('salad')) return <Salad className="h-5 w-5 text-muted-foreground" />;
  if (lowerName.includes('vegetable') || lowerName.includes('carrot') || lowerName.includes('broccoli')) return <Carrot className="h-5 w-5 text-muted-foreground" />;
  if (lowerName.includes('fruit') || lowerName.includes('apple') || lowerName.includes('smoothie')) return <Apple className="h-5 w-5 text-muted-foreground" />;
  // Default icon or handle more cases
  return null; // Or a default Utensils icon if needed
};


export function RecipeCard({ recipe }: RecipeCardProps) {
  const icon = getRecipeIcon(recipe.name);

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
           <CardTitle className="text-2xl font-semibold text-primary">{recipe.name}</CardTitle>
           {icon && <div className="ml-4 mt-1">{icon}</div>}
        </div>
        <CardDescription>A delicious recipe suggestion based on your ingredients.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2 text-accent-foreground">Ingredients:</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
            {recipe.ingredients.split(',').map((ingredient, index) => (
              <li key={index} className="text-sm">{ingredient.trim()}</li>
            ))}
          </ul>
        </div>
        <Separator />
        <div>
          <h3 className="text-lg font-medium mb-2 text-accent-foreground">Instructions:</h3>
          <p className="text-sm whitespace-pre-line leading-relaxed">
            {recipe.instructions}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
