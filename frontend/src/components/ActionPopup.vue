<script setup lang="ts" name="ActionPopup">
import { ref } from 'vue';
import { MoreHorizRound } from '@vicons/material'
import { Icon } from '@vicons/utils'

interface ActionItem {
  id: string;
  label: string;
  icon?: any;
  iconColor?: string;
  onClick: () => void;
}

withDefaults(defineProps<{
  actions: ActionItem[];
}>(), {});

const isPopupOpen = ref(false);

function togglePopup() {
  isPopupOpen.value = !isPopupOpen.value;
}

function handleAction(action: ActionItem) {
  action.onClick();
  isPopupOpen.value = false;
}
</script>

<template>
  <div class="action-wrapper" @click="togglePopup">
    <div class="dots-button">
      <Icon>
        <MoreHorizRound />
      </Icon>
    </div>
    <div v-if="isPopupOpen" class="popup">
      <template v-for="(action, index) in actions" :key="action.id">
        <div 
          class="popup-item" 
          @click.stop="handleAction(action)"
        >
          <Icon v-if="action.icon" :color="action.iconColor">
            <component :is="action.icon" />
          </Icon>
          <span>{{ action.label }}</span>
        </div>
        <div 
          v-if="index < actions.length - 1" 
          class="popup-divider"
        ></div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.action-wrapper {
  position: relative;
}

.dots-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 20px;
  background-color: #f0f2f5;
  border-radius: 4px;
  cursor: pointer;
}

.dots-button:hover {
  background-color: #e5e7eb;
}

.popup {
  position: absolute;
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  background-color: #4c4c4c;
  display: flex;
  color: white;
  font-size: 14px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 10;
  white-space: nowrap;
}

.popup :hover {
  background-color: #606060;
  border-radius: 6px;
}

.popup-divider {
  width: 1px;
  background-color: #6a6a6a;
  align-self: stretch;
  margin: 4px 0;
}

.popup-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
}
</style>
