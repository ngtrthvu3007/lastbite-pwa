<template>
  <div class="py-6">
    <nav class="mb-6 flex gap-3 text-sm font-semibold">
      <NuxtLink to="/merchant" class="text-primary hover:underline">Quản lý cửa hàng</NuxtLink>
      <NuxtLink to="/login" class="text-primary hover:underline">Đăng nhập</NuxtLink>
    </nav>
    <Tabs value="profile" class="max-w-md">
      <TabList>
        <Tab value="profile">Profile</Tab>
        <Tab value="pickup">Pickup</Tab>
      </TabList>

      <TabPanels>
        <TabPanel value="profile" class="space-y-4">
          <p class="text-sm text-red-400">
            Manage the customer details used for LastBite reservations.
          </p>
          <FloatLabel variant="on">
            <InputText id="customer-name" class="w-full" default-value="LastBite Customer" />
            <label for="customer-name">Name</label>
          </FloatLabel>
          <Button label="Save changes" />
        </TabPanel>

        <TabPanel value="pickup" class="space-y-4">
          <p class="text-sm text-muted-color">
            Keep pickup contact details ready before limited food posts expire.
          </p>
          <FloatLabel variant="on">
            <InputText id="pickup-phone" class="w-full" default-value="0900000000" />
            <label for="pickup-phone">Phone</label>
          </FloatLabel>
          <Button label="Update pickup info" severity="secondary" />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
