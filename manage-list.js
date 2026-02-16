const html = String.raw;
export default {
  props: ["list", "show"],
  data() {
    return {
      portfolioList: this.list,
    };
  },
  methods: {
    onClose() {
      this.$emit("onClose");
    },
    onEdit(portfolio) {
      this.$emit("on-edit", portfolio);
    },
    onDelete(id) {
      this.$emit("on-delete", id);
    },
  },
  template: html`
    <div class="cdf-modal cdf-modal--small-on-mobile" :class="{'cdf-modal--show': show}">
      <div class="cdf-modal-dialog cdf-modal-dialog--sm">
        <div class="cdf-modal-content">
          <div class="cdf-modal-header">
            <div class="cdf-modal-header__left">
              <div class="cdf-modal-title">Edit portfolio list</div>
            </div>
            <div class="cdf-modal-header__right">
              <button class="cdf-modal-close-btn" type="button" @click="onClose">
                <svg class="icon">
                  <use xlink:href="#close"></use>
                </svg>
              </button>
            </div>
          </div>
          <!-- .cdf-modal-header -->
          <div class="cdf-modal-body">
            <div class="pf-manage-list">
              <div class="pf-manage-list-item" v-for="item in list">
                <div class="pf-manage-list-item-drag">
                  <svg class="icon pf-manage-list-item-drag__icon">
                    <use xlink:href="#drag"></use>
                  </svg>
                </div>
                <div class="pf-manage-list-item-icon">
                  <div class="pf-icon pf-icon--color-1" :class="['pf-icon--color-' + item.color]">
                    {{ item.name_short }}
                  </div>
                </div>
                <div class="pf-manage-list-item-name">
                  {{ item.name }}
                </div>
                <div class="pf-manage-list-item-actions">
                  <button class="pf-manage-list-item-action" type="button" @click="onDelete(item.id)">
                    <svg class="icon pf-manage-list-item-action__icon">
                      <use xlink:href="#delete"></use>
                    </svg>
                  </button>
                  <button class="pf-manage-list-item-action" type="button" @click="onEdit(item)">
                    <svg class="icon pf-manage-list-item-action__icon">
                      <use xlink:href="#edit"></use>
                    </svg>
                  </button>
                </div>
              </div>
              <!-- .pf-manage-list-item -->
            </div>
            <!-- .pf-manage-list -->
          </div>
          <!-- .cdf-modal-body -->
        </div>
      </div>
      <!-- .cdf-modal-dialog -->
    </div>
    <!-- .cdf-modal -->
  `,
};
