import { useCreateMaintenanceCategory, useFindManyMaintenanceCategory } from "@/app/lib/hooks";
import { Combobox, InputBase, Loader, useCombobox } from "@mantine/core";
import { useEffect, useState } from "react";

interface CategorySelectProps {
  vehicleId: string;
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  disabled?: boolean;
}

export function CategorySelect({ vehicleId, value, onChange, error, disabled }: CategorySelectProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  
  const { data: categories } = useFindManyMaintenanceCategory({
    where: { vehicleId },
  });
  const createCategory = useCreateMaintenanceCategory();

  const optionsData = categories?.map((c) => ({ value: c.id, label: c.name })) || [];
  
  // Sincroniza o campo de texto quando o valor externo muda (ex: importar do plano)
  useEffect(() => {
    if (value) {
      const selected = optionsData.find((item) => item.value === value);
      if (selected) setSearch(selected.label);
    } else {
      setSearch("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, categories]);

  const exactOptionMatch = optionsData.some((item) => item.label === search);
  
  const filteredOptions = optionsData.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase().trim())
  );

  const options = filteredOptions.map((item) => (
    <Combobox.Option value={item.value} key={item.value}>
      {item.label}
    </Combobox.Option>
  ));

  const selectedOption = optionsData.find((item) => item.value === value);

  const handleCreate = async () => {
    if (!search.trim() || creating) return;
    
    setCreating(true);
    try {
      const newCategory = await createCategory.mutateAsync({
        data: { 
          name: search.trim(),
          vehicleId,
        },
      });
      if (newCategory) {
        onChange(newCategory.id);
        setSearch(newCategory.name);
      }
      combobox.closeDropdown();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        if (val === "$create") {
          handleCreate();
        } else {
          onChange(val);
          const selected = optionsData.find((item) => item.value === val);
          setSearch(selected?.label || "");
          combobox.closeDropdown();
        }
      }}
    >
      <Combobox.Target>
        <InputBase
          label="Categoria"
          placeholder="Selecione ou crie uma categoria"
          value={search}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
            if (value) {
              onChange(null); // Clear selection if typing
            }
          }}
          onClick={() => !disabled && combobox.openDropdown()}
          onFocus={() => !disabled && combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            if (!value) {
              setSearch("");
            } else {
              setSearch(selectedOption?.label || "");
            }
          }}
          error={error}
          withAsterisk
          rightSection={creating ? <Loader size={18} /> : null}
          disabled={disabled || creating}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options}
          {!exactOptionMatch && search.trim().length > 0 && (
            <Combobox.Option value="$create" disabled={creating}>
              {creating ? "Criando..." : `+ Criar "${search}"`}
            </Combobox.Option>
          )}

          {options.length === 0 && !search.trim() && (
            <Combobox.Empty>Nada encontrado</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
