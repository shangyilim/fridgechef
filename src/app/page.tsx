
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IngredientForm } from '@/components/ingredient-form';
import { RecipeCard } from '@/components/recipe-card';
import { suggestRecipes, type SuggestRecipesOutput } from '@/ai/flows/suggest-recipes';
import { identifyIngredientsFromVideo } from '@/ai/flows/identify-ingredients-from-video';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UtensilsCrossed, ChefHat, Video, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Define the form schema shared between recipe suggestion and video identification input
const formSchema = z.object({
  ingredients: z
    .string()
    .min(1, { // Allow empty initially, but maybe require after video scan fails? Or let suggestion handle empty. Let's keep it simple for now.
      message: 'Please list at least one ingredient.',
    })
    .describe('A comma-separated list of ingredients available in the fridge.'),
});

type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const [recipes, setRecipes] = React.useState<SuggestRecipesOutput['recipes'] | null>(null);
  const [isSuggestingLoading, setIsSuggestingLoading] = React.useState(false);
  const [suggestionError, setSuggestionError] = React.useState<string | null>(null);

  const [isVideoProcessing, setIsVideoProcessing] = React.useState(false);
  const [videoError, setVideoError] = React.useState<string | null>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Lift form management to the parent component
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
    },
  });

  const handleSuggestRecipes = async (data: FormData) => {
    setIsSuggestingLoading(true);
    setSuggestionError(null);
    setRecipes(null); // Clear previous recipes

    // Manually trigger validation before submitting
    const isValid = await form.trigger();
    if (!isValid) {
      setIsSuggestingLoading(false);
      toast({
        title: 'Invalid Input',
        description: 'Please check the ingredients list.',
        variant: 'destructive',
      });
      return;
    }

    if (!data.ingredients || data.ingredients.trim().length < 3) {
       setIsSuggestingLoading(false);
       setSuggestionError("Please enter some ingredients first.");
       toast({
         title: "Missing Ingredients",
         description: "Tell us what you have before we suggest recipes.",
         variant: "destructive",
       });
       return;
    }


    try {
      const result = await suggestRecipes(data);
      if (result.recipes && result.recipes.length > 0) {
        setRecipes(result.recipes);
         toast({
           title: "Recipes Generated!",
           description: "Bon appétit!",
         });
      } else {
         setSuggestionError("Couldn't find any recipes with those ingredients. Try adding more?");
         toast({
           title: "No Recipes Found",
           description: "Try adding more ingredients or different ones.",
           variant: "destructive",
         });
      }
    } catch (err) {
      console.error("Error suggesting recipes:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setSuggestionError(`Failed to generate recipes: ${errorMessage}`);
      toast({
        title: "Suggestion Error",
        description: `Failed to generate recipes. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSuggestingLoading(false);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Reset previous errors/state
    setVideoError(null);
    setIsVideoProcessing(true);
    // Optionally clear previous recipes and ingredients? Let's clear ingredients.
    form.setValue('ingredients', '');
    setRecipes(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const videoDataUri = reader.result as string;
       if (!videoDataUri) {
           setVideoError("Could not read the video file.");
           toast({ title: "Error Reading Video", description: "The video file could not be processed.", variant: "destructive"});
           setIsVideoProcessing(false);
           return;
       }

      try {
        const result = await identifyIngredientsFromVideo({ videoDataUri });
        if (result.identifiedIngredients) {
          form.setValue('ingredients', result.identifiedIngredients);
          toast({
            title: 'Ingredients Identified!',
            description: 'Check the list and add anything missed.',
          });
        } else {
           setVideoError('Could not identify ingredients from the video. Please enter them manually.');
           toast({
             title: 'Identification Failed',
             description: 'We couldn\'t see any ingredients clearly. Try typing them.',
             variant: 'destructive',
           });
        }
      } catch (err) {
        console.error("Error identifying ingredients from video:", err);
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        setVideoError(`Failed to identify ingredients: ${errorMessage}`);
        toast({
          title: "Identification Error",
          description: `Failed to process video. ${errorMessage}`,
          variant: "destructive",
        });
      } finally {
        setIsVideoProcessing(false);
         // Reset file input value so the same file can be uploaded again if needed
         if (videoInputRef.current) {
           videoInputRef.current.value = '';
         }
      }
    };
    reader.onerror = (error) => {
       console.error("FileReader error:", error);
       setVideoError("Failed to read video file.");
       toast({ title: "File Reading Error", description: "There was an issue reading the video.", variant: "destructive"});
       setIsVideoProcessing(false);
    };
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <ChefHat className="mx-auto h-12 w-12 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          What's Cooking?
        </h2>
        <p className="text-muted-foreground">
          Enter your ingredients manually, or upload a short video of your fridge!
        </p>
      </div>

      {/* Ingredient Input Section */}
      <Card className="w-full shadow-lg border">
         <CardContent className="p-6 space-y-4">
            <IngredientForm
                form={form} // Pass the form object down
                onSubmit={handleSuggestRecipes}
                isLoading={isSuggestingLoading || isVideoProcessing} // Disable form while either process is running
             />

             {/* Video Upload Option */}
             <div className="text-center text-sm text-muted-foreground">OR</div>
             <div className="flex flex-col items-center space-y-2">
               <Label htmlFor="video-upload" className="sr-only">Upload Fridge Video</Label>
               <Input
                 id="video-upload"
                 type="file"
                 accept="video/*"
                 onChange={handleVideoUpload}
                 ref={videoInputRef}
                 className="hidden" // Hide default input
                 disabled={isVideoProcessing || isSuggestingLoading}
               />
               <Button
                 variant="outline"
                 onClick={() => videoInputRef.current?.click()} // Trigger hidden input
                 disabled={isVideoProcessing || isSuggestingLoading}
                 className="w-full"
               >
                 {isVideoProcessing ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Scanning Video...
                   </>
                 ) : (
                   <>
                     <Video className="mr-2 h-4 w-4" />
                     Upload Fridge Video Scan
                   </>
                 )}
               </Button>
               {videoError && (
                 <Alert variant="destructive" className="w-full mt-2 text-xs">
                    <UtensilsCrossed className="h-3 w-3" />
                   <AlertTitle className="text-xs font-semibold">Video Error</AlertTitle>
                   <AlertDescription className="text-xs">{videoError}</AlertDescription>
                 </Alert>
               )}
               <p className="text-xs text-muted-foreground pt-1">Upload a short video (max ~10-15s) showing your ingredients.</p>
             </div>

             {/* Suggest Recipes Button (now part of IngredientForm) */}
         </CardContent>
      </Card>


      {/* Error for Suggestion */}
      {suggestionError && (
        <Alert variant="destructive" className="w-full">
           <UtensilsCrossed className="h-4 w-4" />
          <AlertTitle>Suggestion Error</AlertTitle>
          <AlertDescription>{suggestionError}</AlertDescription>
        </Alert>
      )}

      {/* Loading indicator for suggestions */}
      {isSuggestingLoading && (
         <div className="flex items-center justify-center text-muted-foreground py-4">
           <Loader2 className="mr-2 h-5 w-5 animate-spin" />
           <span>Finding the best recipes...</span>
         </div>
      )}

      {!isSuggestingLoading && !suggestionError && !isVideoProcessing && recipes === null && (
        <div className="text-center text-muted-foreground pt-8">
          Enter some ingredients or upload a video to get started!
        </div>
      )}

      {/* Recipe Results */}
      {recipes && recipes.length > 0 && (
        <div className="w-full space-y-6 pt-4">
          <h3 className="text-2xl font-semibold text-center text-foreground">Recipe Suggestions</h3>
          {recipes.map((recipe, index) => (
            <RecipeCard key={index} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
