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
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  ingredients: z
    .string()
    .min(1, {
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
  const [videoPreviewUrl, setVideoPreviewUrl] = React.useState<string | null>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
    },
  });

  React.useEffect(() => {
    // Cleanup object URL when component unmounts or videoPreviewUrl changes
    const currentUrl = videoPreviewUrl;
    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleSuggestRecipes = async (data: FormData) => {
    setIsSuggestingLoading(true);
    setSuggestionError(null);
    setRecipes(null);

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

    // Create and set object URL for preview.
    // The useEffect will handle revoking the previous URL if any.
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);

    setVideoError(null);
    setIsVideoProcessing(true);
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
           setVideoPreviewUrl(null); // Clear preview on error
           return;
       }

      try {
        const result = await identifyIngredientsFromVideo({ videoDataUri });
        if (result.identifiedIngredients) {
          form.setValue('ingredients', result.identifiedIngredients);
          toast({
            title: 'Ingredients Identified!',
            description: 'Check the list and add anything missed, then click Suggest Recipes.',
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
       setVideoPreviewUrl(null); // Clear preview on file reading error
       if (videoInputRef.current) {
           videoInputRef.current.value = '';
       }
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
          Scan your fridge with a video, or enter your ingredients manually below!
        </p>
      </div>

      <Card className="w-full shadow-lg border">
         <CardContent className="p-6 space-y-6">
             <div className="flex flex-col items-center space-y-4">
               <Label htmlFor="video-upload" className="text-lg font-medium">Scan Your Fridge</Label>
               <p className="text-xs text-muted-foreground text-center">
                 Upload a short video (max ~10-15s) showing your ingredients.
               </p>

               {videoPreviewUrl && (
                 <div className="w-full mt-2 mb-2">
                   <video
                     id="video-preview-player"
                     src={videoPreviewUrl}
                     controls
                     className="w-full aspect-video rounded-md shadow-md border bg-muted"
                     aria-label="Uploaded video preview"
                     preload="metadata"
                   />
                 </div>
               )}

               <div className="w-full space-y-2">
                 <Input
                   id="video-upload"
                   type="file"
                   accept="video/*"
                   onChange={handleVideoUpload}
                   ref={videoInputRef}
                   className="hidden"
                   disabled={isVideoProcessing || isSuggestingLoading}
                 />
                 <Button
                   variant="outline"
                   onClick={() => videoInputRef.current?.click()}
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
                       {videoPreviewUrl ? 'Change Video' : 'Upload Fridge Video Scan'}
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
               </div>
             </div>

             <div className="flex items-center justify-center">
                <Separator className="flex-1" />
                 <span className="px-4 text-sm text-muted-foreground">OR</span>
                 <Separator className="flex-1" />
             </div>

            <IngredientForm
                form={form}
                onSubmit={handleSuggestRecipes}
                isLoading={isSuggestingLoading || isVideoProcessing}
             />
         </CardContent>
      </Card>

      {suggestionError && (
        <Alert variant="destructive" className="w-full">
           <UtensilsCrossed className="h-4 w-4" />
          <AlertTitle>Suggestion Error</AlertTitle>
          <AlertDescription>{suggestionError}</AlertDescription>
        </Alert>
      )}

      {isSuggestingLoading && (
         <div className="flex items-center justify-center text-muted-foreground py-4">
           <Loader2 className="mr-2 h-5 w-5 animate-spin" />
           <span>Finding the best recipes...</span>
         </div>
      )}

      {!isSuggestingLoading && !suggestionError && !isVideoProcessing && recipes === null && (
        <div className="text-center text-muted-foreground pt-8">
          Scan your fridge or enter some ingredients to get started!
        </div>
      )}

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
