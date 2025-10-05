'use client';

import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "./sheet";

const FlashcardTypesForm = () => {
    return (
        <SheetContent>
            <SheetHeader>
                <SheetTitle>Edit Profile</SheetTitle> 
                <SheetDescription>
                    Make changes to your profile here. Click save when you&apos;re done.
                </SheetDescription>
            </SheetHeader>
            <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-name">Name</Label>
            <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-username">Username</Label>
            <Input id="sheet-demo-username" defaultValue="@peduarte" />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
        </SheetContent>
    )
}

export default FlashcardTypesForm;