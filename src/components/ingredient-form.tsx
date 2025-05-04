
'use client';

import type * as React from 'react';
import type { UseFormReturn } from 'react-hook-form'; // Import UseFormReturn
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

// Keep the schema definition if needed elsewhere, or move it to the parent page.
// For simplicity, let's assume the parent passes the correct form instance based on this schema.
const formSchema = z.object({
  ingredients: z
    .string()
    .min(1, { // Adjust min length if needed based on requirements
      message: 'Please list at least one ingredient.',
    })
    .describe('A comma-separated list of ingredients available in the fridge.'),
});

type IngredientFormProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>; // Accept form object as prop
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  isLoading: boolean;
};

export function IngredientForm({ form, onSubmit, isLoading }: IngredientFormProps) {
  // Removed internal useForm hook, now using the passed form object

  return (
    <Form {...form}> {/* Spread the passed form object here */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"> {/* Reduced space */}
        <FormField
          control={form.control}
          name="ingredients"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Your Ingredients</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., chicken breast, broccoli, soy sauce, garlic, rice... (or upload a video below)"
                  className="resize-none min-h-[100px] text-base"
                  {...field}
                  disabled={isLoading} // Use the unified isLoading prop
                />
              </FormControl>
              <FormDescription>
                Enter ingredients separated by commas, or use the video upload.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         {/* Moved the submit button outside the form field, but within the form */}
         <Button type="submit" className="w-full" disabled={isLoading}>
           {isLoading ? ( // Use the unified isLoading prop
             <>
               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               Processing...
             </>
           ) : (
             'Suggest Recipes'
           )}
         </Button>
      </form>
    </Form>
  );
}
