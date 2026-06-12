import type { Metadata } from "next";
import { getPublicBranches } from "@/server/actions/public";
import { RoomPicker } from "@/features/public/components/RoomPicker";

export const metadata: Metadata = {
  title: "Choose Your Room | Chakwal Grand Guest House",
  description: "Pick your preferred room by floor — see live availability for your dates.",
};

interface Props {
  searchParams: { branchId?: string; checkIn?: string; checkOut?: string; adults?: string };
}

export default async function RoomPickerPage({ searchParams }: Props) {
  const branches = await getPublicBranches();

  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Room Selector</p>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-3">
          Choose Your Room
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Pick your preferred floor and room — each tile shows live availability for your dates.
        </p>
      </div>

      <RoomPicker
        branches={branches}
        preselected={{
          branchId: searchParams.branchId,
          checkIn:  searchParams.checkIn,
          checkOut: searchParams.checkOut,
          adults:   searchParams.adults ? Number(searchParams.adults) : undefined,
        }}
      />
    </div>
  );
}
