const html = String.raw;
export default {
  props: ["modelValue"],
  data() {
    const d = new Date(this.modelValue * 1000);
    return {
      display: false,
      val: new Date(),
      year: 2025,
      month: 9,
      timeRange: Array.from(
        { length: 48 },
        (_, i) =>
          `${Math.floor(i / 2)
            .toString()
            .padStart(2, "0")}:${((i % 2) * 30).toString().padStart(2, "0")}`,
      ),
      months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      input:
        [
          d.getDate().toString().padStart(2, "0"),
          (d.getMonth() + 1).toString().padStart(2, 0),
          d.getFullYear(),
        ].join(".") +
        ", " +
        [
          d.getHours().toString().padStart(2, "0"),
          d.getMinutes().toString().padStart(2, "0"),
        ].join(":"),
    };
  },
  mounted() {
    this.handleClickOutside = (e) => {
      if (!this.$refs.element.contains(e.target)) {
        this.display = false;
      }
    };
    document.addEventListener('click', this.handleClickOutside);
  },
  watch: {
    val(d, prev) {
      console.log(prev);
      this.input =
        [
          d.getDate().toString().padStart(2, "0"),
          (d.getMonth() + 1).toString().padStart(2, 0),
          d.getFullYear(),
        ].join(".") +
        ", " +
        [
          d.getHours().toString().padStart(2, "0"),
          d.getMinutes().toString().padStart(2, "0"),
        ].join(":");
      // this.modelValue =
      this.$emit("update:modelValue", Math.floor(d.getTime() / 1000));
    },
    input(v) {
    // Convert to Date object if needed
      const dateTimeRegex = /^(\d{2})\.(\d{2})\.(\d{4}),\s(\d{2}):(\d{2})$/;

        // Usage example:
        const dateString = "15.03.2024, 14:30";
        const match = v.match(dateTimeRegex);

        if (match) {
            const [fullMatch, day, month, year, hours, minutes] = match;
            console.log({
                day,     // "15"
                month,   // "03"
                year,    // "2024"
                hours,   // "14"
                minutes  // "30"
            });

            // Convert to Date object if needed
          const d = new Date(year, month - 1, day, hours, minutes);
          this.val = d;
          this.year = d.getFullYear();
          this.month = d.getMonth() + 1;
        }
    },
  },
  computed: {
    currentMonth() {
      return this.months[this.month - 1];
    },
    matrix() {
      const year = this.year;
      const month = this.month;
      console.log("MATRIX", { y: this.year, m: this.month });
      const firstDay = new Date(year, month - 1, 1);
      const startDay = firstDay.getDay();
      const daysInMonth = new Date(year, month, 0).getDate();
      const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

      // Calculate next month and year
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      // Calculate previous month and year
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      const matrix = [];
      let date = 1;
      let nextMonthDate = 1;

      for (let week = 0; week < 6; week++) {
        const weekArray = [];

        for (let day = 0; day < 7; day++) {
          const cellIndex = week * 7 + day;

          if (cellIndex < startDay) {
            // Previous month
            const prevDate = daysInPrevMonth - startDay + cellIndex + 1;
            weekArray.push([prevYear, prevMonth, prevDate]);
          } else if (date <= daysInMonth) {
            // Current month
            weekArray.push([year, month, date]);
            date++;
          } else {
            // Next month
            weekArray.push([nextYear, nextMonth, nextMonthDate]);
            nextMonthDate++;
          }
        }

        matrix.push(weekArray);

        // Stop if we've included all days of the current month
        if (date > daysInMonth) {
          break;
        }
      }

      return matrix;
    },
  },
  methods: {
    onBlur() {
      const d = this.val;
      this.input =
        [
          d.getDate().toString().padStart(2, "0"),
          (d.getMonth() + 1).toString().padStart(2, 0),
          d.getFullYear(),
        ].join(".") +
        ", " +
        [
          d.getHours().toString().padStart(2, "0"),
          d.getMinutes().toString().padStart(2, "0"),
        ].join(":");
      // this.display = false;
    },
    show() {},
    hide() {},
    select(y, m, d) {
      this.val = new Date(
        y,
        m - 1,
        d,
        this.val.getHours(),
        this.val.getMinutes(),
      );
      // console.log("SELECT", { y, m, d });
      if (m !== this.month) {
        this.month = m;
        this.year = y;
      }
    },
    setTime(t){
      const [h, m] = t.split(':');
      const d = new Date(this.val.getTime());
      d.setHours(+h);
      d.setMinutes(+m);
      this.val = d;
    },
    isSelectedDate(y, m, d) {
      if (y !== this.val.getFullYear()) {
        return false;
      }
      if (m !== this.val.getMonth() + 1) {
        return false;
      }
      return this.val.getDate() === d;
    },
    isSelectedTime(t) {
      const h = this.val.getHours().toString().padStart(2, '0');
      const m = this.val.getMinutes().toString().padStart(2, '0');
      return t === [h,m].join(':');
    },
    isGrayout(y, m, d) {
      if (y !== this.year) {
        return true;
      }
      if (m !== this.month) {
        return true;
      }
      return false;
    },
    upM() {
      this.month = this.month === 11 ? 0 : this.month + 1;
    },
    downM() {
      this.month = this.month === 0 ? 11 : this.month - 1;
    },
    next() {
      const date = new Date(this.year, this.month + 1 - 1);
      this.year = date.getFullYear();
      this.month = date.getMonth() + 1;
    },
    prev() {
      const date = new Date(this.year, this.month - 1 - 1);
      this.year = date.getFullYear();
      this.month = date.getMonth() + 1;
    },
  },

  template: html`
    <div class="cdf-datepicker" ref="element">
      <div class="cdf-field-input">
        <input class="cdf-field-input__el" type="text" v-model="input" v-on:blur="onBlur"  v-on:focus="display = true" />
      </div>
      <div v-show="display" class="cdf-datepicker-wrapper">
        <div class="cdf-datepicker-container">
          <div class="cdf-datepicker-calendar">
            <div>
              <button @click="prev">&lt;</button>
              {{currentMonth}} {{ year }}
              <button @click="next">&gt;</button>
            </div>
            <div v-show="false">
              <button @click="year--">-</button>{{ year }}<button @click="year++">
                +
              </button>
            </div>
            <div v-show="false">
              <button @click="downM">-</button>{{ month }}<button @click="upM">
                +
              </button>
            </div>
            <div class="cdf-datepicker-calendar-top">
              <table>
                <thead>
                  <tr>
                    <th>Su</th>
                    <th>Mo</th>
                    <th>Tu</th>
                    <th>We</th>
                    <th>Th</th>
                    <th>Fr</th>
                    <th>Sa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="week in matrix">
                    <td
                      v-for="[y,m,d] in week"
                      class="cdf-datepicker-calendar-day"
                      :class="{ 'cdf-datepicker-calendar-day--selected': isSelectedDate(y, m, d), 'cdf-datepicker-calendar-day--grayout': isGrayout(y, m, d) }"
                      @click="select(y,m,d)"
                    >
                      {{d}}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            Time
            <div class="cdf-datepicker-time">
              <div v-for="t in timeRange" @click="setTime(t)" class="cdf-datepicker-time__item" :class="{'cdf-datepicker-time--selected': isSelectedTime(t)}">
                {{ t }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
