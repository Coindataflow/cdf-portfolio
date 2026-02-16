import { createPortfolio, updatePortfolio } from "./api";

const html = String.raw;
export default {
  props: ["show"],
  data() {
    const portfolio = typeof this.show !== "boolean" ? this.show : {
      id: null,
      name: "",
      description: "",
      color: 1,
      includeInTotal: true,
    };
    return {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      color: portfolio.color,
      MAX_NAME_LENGTH: 32,
      validationErrors: {},
      supportedColor: [1, 2, 3, 4, 5, 6],
      includeInTotal: portfolio.include_in_total,
      loading: false,
    };
  },
  computed: {
    nameCharsLeft() {
      return this.MAX_NAME_LENGTH - this.name.length;
    },
  },
  watch: {
    name() {
      this.validationErrors.name = null;
    },
    show() {
      const portfolio = typeof this.show !== "boolean" ? this.show : {
        id: null,
        name: "",
        description: "",
        color: 1,
        includeInTotal: true,
      };
      this.id = portfolio.id;
      this.name = portfolio.name;
      this.description = portfolio.description;
      this.color = portfolio.color;
      this.includeInTotal = portfolio.include_in_total;
    },
  },
  methods: {
    async handleSubmit() {
      console.log("submit");
      this.loading = true;
      this.validationErrors = {};
      const { id, name, description, color, includeInTotal } = this;
      const payload = { name, description, color, includeInTotal };
      try {
        const response = id
          ? await updatePortfolio({
              id,
              ...payload,
            })
          : await createPortfolio(payload);

        const data = await response.json();

        switch (response.status) {
          case 200:
          case 201:
            this.$emit("on-close");
            break;
          case 422:
            this.validationErrors = data.errors;
            break;
          default:
            console.log("DEBUG", response);
        }
      } catch (error) {
        console.log("Error", error);
      }
      this.loading = false;
    },
    onClose() {
      this.$emit("on-close");
      this.validationErrors = {};
      this.name = "";
      this.description = "";
      this.color = 1;
      this.includeInTotal = 0;
    },
    getValidationError(field) {
      const errors = this.validationErrors[field];
      return errors && Array.isArray(errors) ? errors.join(";") : false;
    },
  },
  template: html`
    <div
      class="cdf-modal cdf-modal--small-on-mobile"
      :class="{'cdf-modal--show': show}"
      @mousedown.self="onClose"
    >
      <div class="cdf-modal-dialog cdf-modal-dialog--sm" @mousedown.self="onClose">
        <div class="cdf-modal-content">
          <div class="cdf-modal-header">
            <div class="cdf-modal-header__left">
              <div class="cdf-modal-title">Create portfolio</div>
            </div>
            <div class="cdf-modal-header__right">
              <button
                class="cdf-modal-close-btn"
                type="button"
                @click="onClose"
              >
                <svg class="icon">
                  <use xlink:href="#close"></use>
                </svg>
              </button>
            </div>
          </div>
          <!-- .cdf-modal-header -->
          <div class="cdf-modal-body">
            <div class="cdf-modal-section">
              <div
                class="cdf-field"
                :class="{'cdf-field--has-error': getValidationError('name')}"
              >
                <div class="cdf-field__head">
                  <label class="cdf-field-label">Portfolio name</label>
                </div>
                <div class="cdf-field__body">
                  <div class="cdf-field-input">
                    <div></div>
                    <input
                      v-model="name"
                      class="cdf-field-input__el"
                      type="text"
                      :maxlength="MAX_NAME_LENGTH"
                      placeholder="Portfolio name"
                    />
                    <div class="cdf-field-input__right">{{nameCharsLeft}}</div>
                  </div>
                </div>
                <div class="cdf-field__foot" v-if="getValidationError('name')">
                  <div class="cdf-field-hint">
                    {{ getValidationError('name') }}
                  </div>
                </div>
              </div>
            </div>
            <!-- .cdf-modal-section -->
            <div class="cdf-modal-section">
              <div class="cdf-field">
                <div class="cdf-field__head">
                  <label class="cdf-field-label">
                    Description (optional)
                  </label>
                </div>
                <div class="cdf-field__body">
                  <textarea
                    v-model="description"
                    class="cdf-field-input__textarea"
                    rows="5"
                    placeholder="My first investment portfolio..."
                  ></textarea>
                </div>
                <div class="cdf-field__foot">
                  <div class="cdf-field-hint">Maximum 400 characters</div>
                </div>
              </div>
            </div>
            <!-- .cdf-modal-section -->
            <div class="cdf-modal-section">
              <div class="cdf-field">
                <div class="cdf-field__head">
                  <label class="cdf-field-label"> Choose color </label>
                </div>
                <div class="cdf-field__body">
                  <div class="pf-color-picker">
                    <div
                      class="pf-color-picker-item"
                      v-for="v in supportedColor"
                      :style="'--color: var(--color-' + v + ')'"
                    >
                      <input
                        :id="'color_' + v"
                        class="pf-color-picker-item__input"
                        type="radio"
                        v-model="color"
                        :value="v"
                      />
                      <label
                        class="pf-color-picker-item__label"
                        :for="'color_' + v"
                      ></label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- .cdf-modal-section -->
            <div class="cdf-modal-section" v-show="false">
              <div class="pf-hero-line">
                <div class="pf-hero-line-left">
                  <div class="pf-hero-line-icon">
                    <svg class="pf-hero-line-icon__svg">
                      <use xlink:href="#portfel"></use>
                    </svg>
                  </div>
                </div>
                <div class="pf-hero-line-content">
                  <div class="pf-hero-line-title">Include in total</div>
                  <div class="pf-hero-line-description">
                    Calculate in all portfolios Summary
                  </div>
                </div>
                <div class="pf-hero-line-action">
                  <label class="cdf-switch">
                    <input
                      class="cdf-switch__input"
                      type="checkbox"
                      v-model="includeInTotal"
                    />
                    <span class="cdf-switch__slider"></span>
                  </label>
                </div>
              </div>
            </div>
            <!-- .cdf-modal-section -->
          </div>
          <!-- .cdf-modal-body -->
          <div class="cdf-modal-footer">
            <button v-if="!id"
              class="cdf-btn cdf-btn--prim cdf-btn--100w"
              type="button"
              @click="handleSubmit"
              :disabled="loading"
            >
              Create portfolio
            </button>
            <button v-if="id"
              class="cdf-btn cdf-btn--prim cdf-btn--100w"
              type="button"
              @click="handleSubmit"
              :disabled="loading"
            >
              Save changes
            </button>
          </div>
          <!-- .cdf-modal-footer -->
        </div>
      </div>
      <!-- .cdf-modal-dialog -->
    </div>
    <!-- .cdf-modal -->
  `,
};
