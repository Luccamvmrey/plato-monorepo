export const getSetRowGridClass = (showEquipmentWeight: boolean) => {
    return showEquipmentWeight 
        ? "grid-cols-[auto_1fr_1fr_1fr_1fr_auto]" 
        : "grid-cols-[auto_1fr_1fr_1fr_auto]";
};

export const COMMON_GRID_CLASSES = "grid items-center gap-3 p-2 border-b";
