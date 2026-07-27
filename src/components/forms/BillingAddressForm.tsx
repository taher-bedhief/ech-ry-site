"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Select from "react-select";
import countryList from "react-select-country-list";
import { forwardRef, useImperativeHandle, useEffect } from "react";

import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  fullName: z.string().min(3, "Billing name must be at least 3 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  streetAddress: z.string().min(3, "Street must be at least 3 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  postalCode: z.string().min(3, "Postal code must be at least 3 characters"),
});

interface BillingAddressFormProps {
  onFormDataChange: (data: any) => void;
  initialData?: any;
}

const BillingAddressForm = forwardRef(
  ({ onFormDataChange, initialData }: BillingAddressFormProps, ref) => {
    const countries = countryList().getData();

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: initialData || {
        fullName: "",
        phone: "",
        streetAddress: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
      },
    });

    // ✅ Mettre à jour les champs si initialData change
    useEffect(() => {
      if (initialData) {
        form.reset(initialData);
      }
    }, [initialData, form]);

    // ✅ expose trigger et setValues pour le parent
    useImperativeHandle(ref, () => ({
      trigger: form.trigger,
      setValues: (data: any) => form.reset(data),
    }));

    const onFormChange = () => {
      onFormDataChange(form.getValues());
    };

    return (
      <div className="billing-form">
        <h1 className="text-xl font-medium mb-4">Billing Address</h1>
        <Form {...form}>
          <form className="space-y-4" onChange={onFormChange}>
            {/* Billing Name */}
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Name</FormLabel>
                <FormControl><Input {...field} aria-label="Billing Name" /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>

            {/* Phone */}
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl><Input {...field} aria-label="Billing Phone" /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>

            {/* Country dropdown */}
            <FormField control={form.control} name="country" render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Select
                    options={countries}
                    value={countries.find((c) => c.value === field.value)}
                    onChange={(val) => field.onChange(val?.value)}
                    placeholder="Select a country"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>

            {/* City + State */}
            <div className="flex gap-4 flex-col md:flex-row">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>City</FormLabel>
                  <FormControl><Input {...field} aria-label="Billing City" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>State</FormLabel>
                  <FormControl><Input {...field} aria-label="Billing State" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>

            {/* Postal Code + Street Address */}
            <div className="flex gap-4 flex-col md:flex-row">
              <FormField control={form.control} name="postalCode" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl><Input {...field} aria-label="Billing Postal Code" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="streetAddress" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Street Address</FormLabel>
                  <FormControl><Input {...field} aria-label="Billing Street Address" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          </form>
        </Form>
      </div>
    );
  }
);

BillingAddressForm.displayName = "BillingAddressForm";
export default BillingAddressForm;
