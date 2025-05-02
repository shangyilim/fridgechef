
'use client';

import * as React from 'react';
import { IngredientForm } from '@/components/ingredient-form';
import { RecipeCard } from '@/components/recipe-card';
import { suggestRecipes, type SuggestRecipesInput, type SuggestRecipesOutput } from '@/ai/flows/suggest-recipes';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UtensilsCrossed, ChefHat } from 'lucide-react';

export default function Home() {
  const [recipes, setRecipes] = React.useState<SuggestRecipesOutput['recipes'] | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleSuggestRecipes = async (data: SuggestRecipesInput) => {
    setIsLoading(true);
    setError(null);
    setRecipes(null); // Clear previous recipes

    try {
      const result = await suggestRecipes(data);
      if (result.recipes && result.recipes.length > 0) {
        setRecipes(result.recipes);
         toast({
           title: "Recipes Generated!",
           description: "Bon appétit!",
         });
      } else {
         setError("Couldn't find any recipes with those ingredients. Try adding more?");
         toast({
           title: "No Recipes Found",
           description: "Try adding more ingredients.",
           variant: "destructive",
         });
      }
    } catch (err) {
      console.error("Error suggesting recipes:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(`Failed to generate recipes: ${errorMessage}`);
      toast({
        title: "Error",
        description: `Failed to generate recipes. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <ChefHat className="mx-auto h-12 w-12 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          What's Cooking?
        </h2>
        <p className="text-muted-foreground">
          Tell us what's in your fridge, and we'll suggest some recipes!
        </p>
      </div>

      <div className="w-full p-6 bg-card rounded-lg border shadow-sm">
        <IngredientForm onSubmit={handleSuggestRecipes} isLoading={isLoading} />
      </div>

      {error && (
        <Alert variant="destructive" className="w-full">
           <UtensilsCrossed className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
         <div className="text-center text-muted-foreground">Loading recipes...</div>
      )}

      {!isLoading && !error && recipes === null && (
        <div className="text-center text-muted-foreground pt-8">
          Enter some ingredients above to get started!
        </div>
      )}

      {recipes && recipes.length > 0 && (
        <div className="w-full space-y-6">
          <h3 className="text-2xl font-semibold text-center text-foreground">Recipe Suggestions</h3>
          {recipes.map((recipe, index) => (
            <RecipeCard key={index} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
