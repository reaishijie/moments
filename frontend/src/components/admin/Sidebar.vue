<script setup lang="ts" name="ASidebar">
import { useSidebarStore } from '@/store/admin/sidebar'
import { SunRegular, AddressCardRegular, CommentRegular, Buffer, NodeJs, GemRegular, AngleDown } from '@vicons/fa'
import { Icon } from '@vicons/utils'
import { computed, onUnmounted, ref, type Component, watch } from 'vue'
import { useRoute } from 'vue-router'

const sidebarStore = useSidebarStore()
const route = useRoute()
const iconMap: Record<string, Component> = {
  default: NodeJs,
  dashboard: GemRegular,
  'admin-article': Buffer,
  'admin-comment': CommentRegular,
  'admin-setting': SunRegular,
  'admin-user': AddressCardRegular,
}
const openParentName = ref<string | null>(null)
const dockOffset = ref({ x: 0, y: 0 })
const isDraggingDock = ref(false)
let dragState: {
  startX: number
  startY: number
  originX: number
  originY: number
  element: HTMLElement
} | null = null

const dockStyle = computed(() => ({
  transform: `translate3d(${dockOffset.value.x}px, ${dockOffset.value.y}px, 0)`,
}))

const dockPlacement = computed(() => {
  const centerX = window.innerWidth / 2 + dockOffset.value.x
  const centerY = window.innerHeight - 52 + dockOffset.value.y

  if (centerX < window.innerWidth * 0.28) return 'left'
  if (centerX > window.innerWidth * 0.72) return 'right'
  if (centerY < window.innerHeight * 0.48) return 'top'
  return 'bottom'
})

const dockClasses = computed(() => ({
  dragging: isDraggingDock.value,
  'placement-left': dockPlacement.value === 'left',
  'placement-right': dockPlacement.value === 'right',
  'placement-top': dockPlacement.value === 'top',
  'placement-bottom': dockPlacement.value === 'bottom',
}))

function isShowChildren(name: string) {
  openParentName.value = openParentName.value === name ? null : name
}

function closeDockMenu() {
  openParentName.value = null
}

function isRouteActive(name?: unknown) {
  return route.name === name || route.matched.some(item => item.name === name)
}

function clampDockOffset(x: number, y: number) {
  if (!dragState) return { x, y }

  const padding = 8
  const dockWidth = dragState.element.offsetWidth
  const dockHeight = dragState.element.offsetHeight
  const baseLeft = (window.innerWidth - dockWidth) / 2
  const baseTop = window.innerHeight - (window.innerWidth <= 768 ? 10 : 18) - dockHeight
  const left = baseLeft + x
  const right = left + dockWidth
  const top = baseTop + y
  const bottom = top + dockHeight

  if (left < padding) x += padding - left
  if (right > window.innerWidth - padding) x -= right - (window.innerWidth - padding)
  if (top < padding) y += padding - top
  if (bottom > window.innerHeight - padding) y -= bottom - (window.innerHeight - padding)

  return { x, y }
}

function handleDockPointerMove(event: PointerEvent) {
  if (!dragState) return
  const nextX = dragState.originX + event.clientX - dragState.startX
  const nextY = dragState.originY + event.clientY - dragState.startY
  dockOffset.value = clampDockOffset(nextX, nextY)
}

function stopDockDrag() {
  dragState = null
  isDraggingDock.value = false
  window.removeEventListener('pointermove', handleDockPointerMove)
  window.removeEventListener('pointerup', stopDockDrag)
  window.removeEventListener('pointercancel', stopDockDrag)
}

function startDockDrag(event: PointerEvent) {
  if (event.button !== 0) return
  const target = event.target as HTMLElement | null
  if (target?.closest('button, a, .child-dock')) return

  const currentTarget = event.currentTarget as HTMLElement
  dragState = {
    startX: event.clientX,
    startY: event.clientY,
    originX: dockOffset.value.x,
    originY: dockOffset.value.y,
    element: currentTarget,
  }
  isDraggingDock.value = true
  closeDockMenu()
  event.preventDefault()
  window.addEventListener('pointermove', handleDockPointerMove)
  window.addEventListener('pointerup', stopDockDrag)
  window.addEventListener('pointercancel', stopDockDrag)
}

watch(() => route.fullPath, closeDockMenu)

onUnmounted(stopDockDrag)

defineExpose({
  closeDockMenu,
})
</script>

<template>
  <aside class="admin-dock" aria-label="后台菜单栏">
    <nav
      class="dock-shelf"
      :class="dockClasses"
      :style="dockStyle"
      aria-label="后台导航"
      title="拖动空白区域可移动菜单栏"
      @pointerdown="startDockDrag"
    >
      <ul>
        <li v-for="item in sidebarStore.arr" :key="item.path" class="dock-slot">
          <button
            v-if="item.children"
            class="dock-item dock-button"
            :class="{ active: isRouteActive(item.name), opened: openParentName === item.name }"
            :title="item.meta?.title as string || '其他页面'"
            @click="isShowChildren(item.name as string)"
          >
            <span class="icon-plate">
              <Icon size="19px"><component :is="iconMap[item.name as string] || NodeJs" /></Icon>
            </span>
            <span class="dock-label">{{ item.meta!.title }}</span>
            <Icon class="chevron"><AngleDown /></Icon>
          </button>

          <router-link
            v-else
            :to="{ name: item.name }"
            class="dock-item"
            :class="{ active: isRouteActive(item.name) }"
            :title="item.meta?.title as string || '其他页面'"
          >
            <span class="icon-plate">
              <Icon size="19px"><component :is="iconMap[item.name as string] || NodeJs" /></Icon>
            </span>
            <span class="dock-label">{{ item.meta!.title }}</span>
          </router-link>

          <Transition name="dock-popover">
            <ul v-if="item.children && openParentName === item.name" class="child-dock">
              <li v-for="child in item.children" :key="child.path">
                <router-link
                  :to="{ name: child.name }"
                  class="child-item"
                  :class="{ active: isRouteActive(child.name) }"
                  :title="child.meta?.title as string || '其他页面'"
                >
                  <span class="child-mark"></span>
                  <span>{{ child.meta!.title }}</span>
                </router-link>
              </li>
            </ul>
          </Transition>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
.admin-dock {
  position: fixed;
  right: 0;
  bottom: 18px;
  left: 0;
  z-index: 60;
  display: flex;
  justify-content: center;
  padding: 0 14px;
  pointer-events: none;
}

.dock-shelf {
  position: relative;
  max-width: calc(100vw - 28px);
  padding: 9px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 30px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--color-bg-app) 90%, transparent), color-mix(in srgb, var(--color-bg-app) 68%, transparent)),
    linear-gradient(90deg, rgba(108, 173, 241, 0.16), rgba(248, 167, 120, 0.14));
  box-shadow: 0 24px 70px rgba(42, 62, 92, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(22px) saturate(160%);
  cursor: grab;
  pointer-events: auto;
  user-select: none;
  touch-action: none;
  transition: transform 0.12s ease;
}

.dock-shelf.dragging {
  cursor: grabbing;
  transition: none;
}

.dock-shelf::before {
  content: '';
  position: absolute;
  inset: 8px;
  z-index: -1;
  border-radius: 24px;
  background: linear-gradient(90deg, rgba(108, 173, 241, 0.26), rgba(83, 177, 106, 0.16), rgba(248, 167, 120, 0.28));
  filter: blur(18px);
  opacity: 0.74;
}

.dock-shelf > ul,
.dock-shelf li {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dock-shelf > ul {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.dock-shelf.placement-left > ul,
.dock-shelf.placement-right > ul {
  flex-direction: column;
  align-items: center;
}

.dock-slot {
  position: relative;
}

.dock-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 54px;
  height: 54px;
  border: 0;
  border-radius: 20px;
  color: #4E6086;
  background: color-mix(in srgb, var(--color-bg-app) 72%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 65%, transparent);
  text-decoration: none;
  font: inherit;
  cursor: pointer;
  overflow: hidden;
  user-select: none;
  transform-origin: bottom center;
  transition: width 0.24s ease, transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.22s ease, color 0.22s ease, box-shadow 0.22s ease;
}

.dock-item::before {
  content: '';
  position: absolute;
  inset: -34%;
  background: conic-gradient(from 190deg, transparent, rgba(108, 173, 241, 0.22), rgba(248, 167, 120, 0.2), transparent 70%);
  opacity: 0;
  transform: rotate(18deg) scale(0.7);
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.dock-item::after {
  content: '';
  position: absolute;
  bottom: 5px;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #f8a778;
  opacity: 0;
  transform: translateX(-50%) scale(0.5);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.icon-plate,
.dock-label,
.chevron {
  position: relative;
  z-index: 1;
}

.icon-plate {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.34);
}

.dock-label {
  display: none;
  max-width: 64px;
  overflow: hidden;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dock-item:hover,
.dock-item.opened {
  color: #212121;
  box-shadow: 0 18px 42px rgba(108, 173, 241, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.58);
  transform: translateY(-11px) scale(1.08);
}

.dock-shelf.placement-left .dock-item:hover,
.dock-shelf.placement-left .dock-item.opened,
.dock-shelf.placement-right .dock-item:hover,
.dock-shelf.placement-right .dock-item.opened {
  transform: translateX(0) scale(1.08);
}

.dock-item:hover::before,
.dock-item.opened::before,
.dock-item.active::before {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.dock-item.active {
  width: 124px;
  justify-content: flex-start;
  padding: 0 12px 0 10px;
  color: #ffffff;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.16), transparent),
    linear-gradient(135deg, #586C97, #6cadf1 58%, #f8a778);
  box-shadow: 0 20px 46px rgba(88, 108, 151, 0.26);
}

.dock-item.active .dock-label {
  display: inline;
}

.dock-shelf.placement-left .dock-item.active,
.dock-shelf.placement-right .dock-item.active {
  width: 54px;
  justify-content: center;
  padding: 0;
}

.dock-shelf.placement-left .dock-item.active .dock-label,
.dock-shelf.placement-right .dock-item.active .dock-label {
  display: none;
}

.dock-item.active::after,
.dock-item.opened::after {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

.dock-item.active::after {
  background: #ffffff;
}

.chevron {
  position: absolute;
  right: 8px;
  bottom: 7px;
  width: 11px;
  color: currentColor;
  opacity: 0.65;
  transition: transform 0.2s ease;
}

.dock-item.opened .chevron {
  transform: rotate(180deg);
}

.child-dock {
  position: absolute;
  bottom: calc(100% + 18px);
  left: 50%;
  display: grid;
  gap: 7px;
  min-width: 156px;
  padding: 9px;
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  border-radius: 20px;
  background:
    radial-gradient(circle at 100% 0, rgba(248, 167, 120, 0.18), transparent 34%),
    color-mix(in srgb, var(--color-bg-app) 94%, transparent);
  box-shadow: 0 22px 62px rgba(39, 57, 84, 0.2);
  backdrop-filter: blur(18px) saturate(150%);
  transform: translateX(-50%);
}

.dock-shelf.placement-top .child-dock {
  top: calc(100% + 18px);
  bottom: auto;
}

.dock-shelf.placement-left .child-dock {
  top: 50%;
  bottom: auto;
  left: calc(100% + 18px);
  transform: translateY(-50%);
}

.dock-shelf.placement-right .child-dock {
  top: 50%;
  right: calc(100% + 18px);
  bottom: auto;
  left: auto;
  transform: translateY(-50%);
}

.child-dock::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  width: 12px;
  height: 12px;
  border-right: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  background: color-mix(in srgb, var(--color-bg-app) 94%, transparent);
  transform: translateX(-50%) rotate(45deg);
}

.dock-shelf.placement-top .child-dock::after {
  top: -6px;
  bottom: auto;
  border: 0;
  border-top: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  border-left: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
}

.dock-shelf.placement-left .child-dock::after {
  top: 50%;
  right: auto;
  bottom: auto;
  left: -6px;
  border: 0;
  border-left: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  transform: translateY(-50%) rotate(45deg);
}

.dock-shelf.placement-right .child-dock::after {
  top: 50%;
  right: -6px;
  bottom: auto;
  left: auto;
  transform: translateY(-50%) rotate(45deg);
}

.child-item {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 11px;
  border-radius: 14px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.child-item:hover,
.child-item.active {
  color: #586C97;
  background: var(--color-ad);
  transform: translateX(2px);
}

.child-mark {
  width: 10px;
  height: 10px;
  border-radius: 4px 999px 999px 999px;
  background: linear-gradient(135deg, #6cadf1, #f8a778);
  transform: rotate(-12deg);
}

.dock-popover-enter-active,
.dock-popover-leave-active {
  transition: all 0.24s cubic-bezier(0.68, -0.2, 0.27, 1.25);
}

.dock-popover-enter-from,
.dock-popover-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px) scale(0.94);
}

.dock-shelf.placement-top .dock-popover-enter-from,
.dock-shelf.placement-top .dock-popover-leave-to {
  transform: translateX(-50%) translateY(-12px) scale(0.94);
}

.dock-shelf.placement-left .dock-popover-enter-from,
.dock-shelf.placement-left .dock-popover-leave-to {
  transform: translateY(-50%) translateX(-12px) scale(0.94);
}

.dock-shelf.placement-right .dock-popover-enter-from,
.dock-shelf.placement-right .dock-popover-leave-to {
  transform: translateY(-50%) translateX(12px) scale(0.94);
}

@media (prefers-reduced-motion: reduce) {
  .dock-item,
  .dock-item::before,
  .dock-item::after,
  .dock-popover-enter-active,
  .dock-popover-leave-active {
    transition: none;
  }
}

@media (max-width: 768px) {
  .admin-dock {
    bottom: 10px;
    justify-content: flex-start;
    padding: 0 10px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .admin-dock::-webkit-scrollbar {
    display: none;
  }

  .dock-shelf {
    min-width: max-content;
    max-width: none;
    padding: 7px;
    border-radius: 24px;
  }

  .dock-shelf > ul {
    gap: 7px;
  }

  .dock-item {
    width: 50px;
    height: 50px;
    border-radius: 18px;
  }

  .dock-item.active {
    width: 104px;
  }

  .dock-item:hover,
  .dock-item.opened {
    transform: translateY(-7px) scale(1.04);
  }

  .dock-label {
    max-width: 48px;
    font-size: 12px;
  }

  .dock-shelf.placement-bottom .child-dock {
    bottom: calc(100% + 16px);
  }

  .dock-shelf.placement-top .child-dock {
    top: calc(100% + 16px);
  }
}
</style>
